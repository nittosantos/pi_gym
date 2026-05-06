<?php

declare(strict_types=1);

namespace App;

use PDO;

final class MemberController
{
    public static function workouts(): never
    {
        if (Request::method() !== 'GET') {
            Response::error('Método não permitido', 405);
        }
        $ctx = Auth::requireMemberRead();
        $gymId = $ctx['gym_id'];
        $userId = (int) $ctx['user']['id'];

        $stmt = Database::pdo()->prepare(
            'SELECT id, title, content, created_at, updated_at
             FROM workouts
             WHERE gym_id = :gid AND member_user_id = :uid
             ORDER BY id DESC'
        );
        $stmt->execute(['gid' => $gymId, 'uid' => $userId]);
        Response::json(['workouts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public static function checkin(): never
    {
        if (Request::method() !== 'POST') {
            Response::error('Método não permitido', 405);
        }
        $ctx = Auth::requireActiveMember();
        $gymId = $ctx['gym_id'];
        $userId = (int) $ctx['user']['id'];

        $stmt = Database::pdo()->prepare(
            'INSERT INTO checkins (gym_id, member_user_id, checked_in_at)
             VALUES (:gid, :uid, NOW())
             RETURNING id, checked_in_at, checked_out_at'
        );
        $stmt->execute(['gid' => $gymId, 'uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        Response::json(['checkin' => $row], 201);
    }

    /** Fecha o check-in mais recente ainda em aberto (sem horário de saída). */
    public static function checkout(): never
    {
        if (Request::method() !== 'POST') {
            Response::error('Método não permitido', 405);
        }
        $ctx = Auth::requireActiveMember();
        $gymId = $ctx['gym_id'];
        $userId = (int) $ctx['user']['id'];

        $sql = 'WITH pick AS (
                    SELECT id FROM checkins
                    WHERE gym_id = :gid AND member_user_id = :uid AND checked_out_at IS NULL
                    ORDER BY checked_in_at DESC
                    LIMIT 1
                )
                UPDATE checkins c
                SET checked_out_at = NOW()
                FROM pick
                WHERE c.id = pick.id
                RETURNING c.id, c.checked_in_at, c.checked_out_at';

        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute(['gid' => $gymId, 'uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row === false) {
            Response::error('Não há check-in em aberto para registrar a saída.', 409);
        }

        Response::json(['checkout' => $row]);
    }

    /** Registra um treino/check-in completo do dia (entrada e saída). */
    public static function registerTrainingRecord(): never
    {
        if (Request::method() !== 'POST') {
            Response::error('Método não permitido', 405);
        }
        $ctx = Auth::requireActiveMember();
        $gymId = $ctx['gym_id'];
        $userId = (int) $ctx['user']['id'];
        $body = Request::jsonBody();

        $date = trim((string) ($body['date'] ?? ''));
        $arrival = trim((string) ($body['arrival_time'] ?? ''));
        $departure = trim((string) ($body['departure_time'] ?? ''));
        $workoutId = (int) ($body['workout_id'] ?? 0);

        /** Alinhado ao campo de data do navegador: "hoje" no fuso de Brasília. */
        $tzBr = new \DateTimeZone('America/Sao_Paulo');
        $today = (new \DateTimeImmutable('now', $tzBr))->format('Y-m-d');
        if ($date === '') {
            $date = $today;
        }
        if ($date !== $today) {
            Response::error(
                'Só é permitido registrar treino para o dia de hoje (horário de Brasília).',
                422
            );
        }

        if (!preg_match('/^\d{2}:\d{2}$/', $arrival) || !preg_match('/^\d{2}:\d{2}$/', $departure)) {
            Response::error('Informe horários válidos no formato HH:MM.', 422);
        }

        $arrivalAt = \DateTimeImmutable::createFromFormat(
            'Y-m-d H:i',
            $date . ' ' . $arrival,
            $tzBr
        );
        $departureAt = \DateTimeImmutable::createFromFormat(
            'Y-m-d H:i',
            $date . ' ' . $departure,
            $tzBr
        );
        if (!$arrivalAt || !$departureAt) {
            Response::error('Horário inválido.', 422);
        }
        if ($departureAt < $arrivalAt) {
            Response::error('Horário de saída não pode ser menor que o de entrada.', 422);
        }
        if ($workoutId <= 0) {
            Response::error('Selecione o treino realizado.', 422);
        }

        $workoutStmt = Database::pdo()->prepare(
            'SELECT id, title
             FROM workouts
             WHERE id = :wid AND gym_id = :gid AND member_user_id = :uid
             LIMIT 1'
        );
        $workoutStmt->execute([
            'wid' => $workoutId,
            'gid' => $gymId,
            'uid' => $userId,
        ]);
        $workout = $workoutStmt->fetch(PDO::FETCH_ASSOC);
        if ($workout === false) {
            Response::error('Treino inválido para este aluno.', 422);
        }

        $stmt = Database::pdo()->prepare(
            'INSERT INTO checkins (gym_id, member_user_id, workout_id, checked_in_at, checked_out_at)
             VALUES (:gid, :uid, :wid, :cin, :cout)
             RETURNING id, workout_id, checked_in_at, checked_out_at'
        );
        $stmt->execute([
            'gid' => $gymId,
            'uid' => $userId,
            'wid' => $workoutId,
            'cin' => $arrivalAt->format('Y-m-d H:i:sP'),
            'cout' => $departureAt->format('Y-m-d H:i:sP'),
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::json(['record' => $row], 201);
    }

    /** Histórico de registros do aluno para dashboard. */
    public static function trainingHistory(): never
    {
        if (Request::method() !== 'GET') {
            Response::error('Método não permitido', 405);
        }
        $ctx = Auth::requireMemberRead();
        $gymId = $ctx['gym_id'];
        $userId = (int) $ctx['user']['id'];

        $stmt = Database::pdo()->prepare(
            'SELECT c.id, c.workout_id, COALESCE(w.title, CONCAT(\'Treino #\', c.workout_id::text)) AS workout_title,
                    c.checked_in_at, c.checked_out_at
             FROM checkins c
             LEFT JOIN workouts w ON w.id = c.workout_id
             WHERE c.gym_id = :gid AND c.member_user_id = :uid
             ORDER BY checked_in_at DESC
             LIMIT 50'
        );
        $stmt->execute(['gid' => $gymId, 'uid' => $userId]);
        Response::json(['history' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
}
