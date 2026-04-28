<?php

declare(strict_types=1);

namespace App;

use PDO;

final class OwnerController
{
    public static function members(): never
    {
        if (Request::method() !== 'GET') {
            Response::error('Método não permitido', 405);
        }
        $ctx = Auth::requireOwner();
        $gymId = $ctx['gym_id'];

        $stmt = Database::pdo()->prepare(
            'SELECT u.id, u.email, u.status, m.status AS membership_status, m.created_at AS requested_at
             FROM users u
             JOIN memberships m ON m.user_id = u.id
             WHERE m.gym_id = :gid AND u.role = :role
             ORDER BY u.id ASC'
        );
        $stmt->execute(['gid' => $gymId, 'role' => 'member']);
        Response::json(['members' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public static function approveMember(int $memberId): never
    {
        if (Request::method() !== 'POST') {
            Response::error('Método não permitido', 405);
        }
        $ctx = Auth::requireOwner();
        $gymId = $ctx['gym_id'];

        if ($memberId <= 0) {
            Response::error('ID inválido', 422);
        }

        if (!Auth::memberBelongsToGym($memberId, $gymId)) {
            Response::error('Aluno não encontrado nesta academia', 404);
        }

        $stmt = Database::pdo()->prepare('CALL sp_approve_member(:gid, :uid)');
        $stmt->execute(['gid' => $gymId, 'uid' => $memberId]);

        Response::json(['ok' => true]);
    }

    public static function workouts(): never
    {
        $method = Request::method();
        $ctx = Auth::requireOwner();
        $gymId = $ctx['gym_id'];

        if ($method === 'GET') {
            $memberId = isset($_GET['member_id']) ? (int) $_GET['member_id'] : 0;
            if ($memberId <= 0) {
                Response::error('Informe member_id na query string', 422);
            }
            if (!Auth::memberBelongsToGym($memberId, $gymId)) {
                Response::error('Aluno não pertence à sua academia', 404);
            }
            $stmt = Database::pdo()->prepare(
                'SELECT id, member_user_id, title, content, created_at, updated_at
                 FROM workouts
                 WHERE gym_id = :gid AND member_user_id = :mid
                 ORDER BY id DESC'
            );
            $stmt->execute(['gid' => $gymId, 'mid' => $memberId]);
            Response::json(['workouts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }

        if ($method === 'POST') {
            $body = Request::jsonBody();
            $memberUserId = (int) ($body['member_user_id'] ?? 0);
            $content = trim((string) ($body['content'] ?? ''));
            $title = trim((string) ($body['title'] ?? ''));

            if ($memberUserId <= 0) {
                Response::error('member_user_id é obrigatório', 422);
            }
            if ($content === '') {
                Response::error('Conteúdo do treino é obrigatório', 422);
            }
            if (!Auth::memberBelongsToGym($memberUserId, $gymId)) {
                Response::error('Aluno não pertence à sua academia', 404);
            }

            $stmt = Database::pdo()->prepare(
                'INSERT INTO workouts (gym_id, member_user_id, title, content)
                 VALUES (:gid, :mid, :title, :content)'
            );
            $stmt->execute([
                'gid' => $gymId,
                'mid' => $memberUserId,
                'title' => $title === '' ? null : $title,
                'content' => $content,
            ]);
            $id = (int) Database::pdo()->lastInsertId();
            Response::json(['id' => $id, 'ok' => true], 201);
        }

        Response::error('Método não permitido', 405);
    }

    public static function workoutById(int $id): never
    {
        $method = Request::method();
        $ctx = Auth::requireOwner();
        $gymId = $ctx['gym_id'];

        if ($id <= 0) {
            Response::error('ID inválido', 422);
        }

        $stmt = Database::pdo()->prepare(
            'SELECT id FROM workouts WHERE id = :id AND gym_id = :gid LIMIT 1'
        );
        $stmt->execute(['id' => $id, 'gid' => $gymId]);
        if ($stmt->fetchColumn() === false) {
            Response::error('Treino não encontrado', 404);
        }

        if ($method === 'PATCH' || $method === 'PUT') {
            $body = Request::jsonBody();
            $content = array_key_exists('content', $body) ? trim((string) $body['content']) : null;
            $title = array_key_exists('title', $body) ? trim((string) $body['title']) : null;

            if ($content !== null && $content === '') {
                Response::error('Conteúdo não pode ser vazio', 422);
            }

            $fields = [];
            $params = ['id' => $id, 'gid' => $gymId];
            if ($content !== null) {
                $fields[] = 'content = :content';
                $params['content'] = $content;
            }
            if ($title !== null) {
                $fields[] = 'title = :title';
                $params['title'] = $title === '' ? null : $title;
            }
            if ($fields === []) {
                Response::error('Nada para atualizar', 422);
            }
            $sql = 'UPDATE workouts SET ' . implode(', ', $fields) . ' WHERE id = :id AND gym_id = :gid';
            $stmt = Database::pdo()->prepare($sql);
            $stmt->execute($params);
            Response::json(['ok' => true]);
        }

        if ($method === 'DELETE') {
            $stmt = Database::pdo()->prepare('DELETE FROM workouts WHERE id = :id AND gym_id = :gid');
            $stmt->execute(['id' => $id, 'gid' => $gymId]);
            Response::json(['ok' => true]);
        }

        Response::error('Método não permitido', 405);
    }

    public static function checkins(): never
    {
        if (Request::method() !== 'GET') {
            Response::error('Método não permitido', 405);
        }
        $ctx = Auth::requireOwner();
        $gymId = $ctx['gym_id'];
        $memberId = isset($_GET['member_id']) ? (int) $_GET['member_id'] : 0;

        $sql = 'SELECT c.id, c.member_user_id, u.email AS member_email,
                       c.workout_id, COALESCE(w.title, CONCAT(\'Treino #\', c.workout_id::text)) AS workout_title,
                       c.checked_in_at, c.checked_out_at
                FROM checkins c
                JOIN users u ON u.id = c.member_user_id
                LEFT JOIN workouts w ON w.id = c.workout_id
                WHERE c.gym_id = :gid';
        $params = ['gid' => $gymId];
        if ($memberId > 0) {
            if (!Auth::memberBelongsToGym($memberId, $gymId)) {
                Response::error('Aluno não pertence à sua academia', 404);
            }
            $sql .= ' AND c.member_user_id = :mid';
            $params['mid'] = $memberId;
        }
        $sql .= ' ORDER BY c.checked_in_at DESC LIMIT 500';

        $stmt = Database::pdo()->prepare($sql);
        $stmt->execute($params);
        Response::json(['checkins' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
}
