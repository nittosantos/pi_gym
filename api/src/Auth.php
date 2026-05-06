<?php

declare(strict_types=1);

namespace App;

use PDO;

final class Auth
{
    public static function requireLogin(): array
    {
        $userId = $_SESSION['user_id'] ?? null;
        if ($userId === null || $userId === '' || !is_numeric($userId)) {
            Response::error('Não autenticado', 401);
        }
        $userId = (int) $userId;
        if ($userId <= 0) {
            Response::error('Não autenticado', 401);
        }

        $stmt = Database::pdo()->prepare(
            'SELECT id, email, role, status FROM users WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user === false) {
            Response::error('Não autenticado', 401);
        }

        return $user;
    }

    /** @return array{user: array, gym_id: int} */
    public static function requireActiveMember(): array
    {
        $user = self::requireLogin();
        if (($user['role'] ?? '') !== 'member') {
            Response::error('Acesso exclusivo para alunos', 403);
        }

        $stmt = Database::pdo()->prepare(
            'SELECT m.gym_id, m.status AS membership_status
             FROM memberships m
             WHERE m.user_id = :uid
             LIMIT 1'
        );
        $stmt->execute(['uid' => (int) $user['id']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row === false) {
            Response::error('Você não está vinculado a uma academia', 403);
        }
        if (($user['status'] ?? '') !== 'active') {
            Response::error('Sua conta ainda não foi aprovada pela gestão da academia.', 403);
        }

        $ms = (string) ($row['membership_status'] ?? '');
        if ($ms === 'suspended') {
            Response::error(
                'Acesso suspenso: você pode apenas consultar treinos e histórico. Regularize na academia para registrar novamente.',
                403
            );
        }
        if ($ms !== 'active') {
            Response::error('Sua conta ainda não foi aprovada pela gestão da academia.', 403);
        }

        return ['user' => $user, 'gym_id' => (int) $row['gym_id']];
    }

    /**
     * Aluno com conta ativa e vínculo ativo ou suspenso (leitura: treinos, histórico).
     *
     * @return array{user: array, gym_id: int, membership_status: string}
     */
    public static function requireMemberRead(): array
    {
        $user = self::requireLogin();
        if (($user['role'] ?? '') !== 'member') {
            Response::error('Acesso exclusivo para alunos', 403);
        }
        if (($user['status'] ?? '') !== 'active') {
            Response::error('Sua conta ainda não foi aprovada pela gestão da academia.', 403);
        }

        $stmt = Database::pdo()->prepare(
            'SELECT m.gym_id, m.status AS membership_status
             FROM memberships m
             WHERE m.user_id = :uid
             LIMIT 1'
        );
        $stmt->execute(['uid' => (int) $user['id']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row === false) {
            Response::error('Você não está vinculado a uma academia', 403);
        }

        $ms = (string) ($row['membership_status'] ?? '');
        if (!in_array($ms, ['active', 'suspended'], true)) {
            Response::error('Sua conta ainda não foi aprovada pela gestão da academia.', 403);
        }

        return [
            'user' => $user,
            'gym_id' => (int) $row['gym_id'],
            'membership_status' => $ms,
        ];
    }

    /** @return array{user: array, gym_id: int} */
    public static function requireOwner(): array
    {
        $user = self::requireLogin();
        if (($user['role'] ?? '') !== 'owner') {
            Response::error('Acesso exclusivo para o dono da academia', 403);
        }

        $stmt = Database::pdo()->prepare(
            'SELECT id FROM gyms WHERE owner_user_id = :uid LIMIT 1'
        );
        $stmt->execute(['uid' => (int) $user['id']]);
        $gym = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($gym === false) {
            Response::error('Academia não encontrada para este usuário', 403);
        }

        return ['user' => $user, 'gym_id' => (int) $gym['id']];
    }

    public static function ownerGymId(int $ownerUserId): ?int
    {
        $stmt = Database::pdo()->prepare(
            'SELECT id FROM gyms WHERE owner_user_id = :uid LIMIT 1'
        );
        $stmt->execute(['uid' => $ownerUserId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row === false ? null : (int) $row['id'];
    }

    public static function memberBelongsToGym(int $memberUserId, int $gymId): bool
    {
        $stmt = Database::pdo()->prepare(
            'SELECT 1 FROM memberships WHERE user_id = :uid AND gym_id = :gid LIMIT 1'
        );
        $stmt->execute(['uid' => $memberUserId, 'gid' => $gymId]);
        return $stmt->fetchColumn() !== false;
    }
}
