<?php

declare(strict_types=1);

namespace App;

use PDO;
use PDOException;

final class AuthController
{
    public static function login(): never
    {
        if (Request::method() !== 'POST') {
            Response::error('Método não permitido', 405);
        }
        $body = Request::jsonBody();
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($email === '' || $password === '') {
            Response::error('Informe e-mail e senha', 422);
        }

        $stmt = Database::pdo()->prepare(
            'SELECT id, email, password_hash, role, status FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user === false || !password_verify($password, $user['password_hash'])) {
            Response::error('Credenciais inválidas', 401);
        }

        $_SESSION['user_id'] = (int) $user['id'];
        unset($user['password_hash']);

        Response::json(['user' => self::enrichUser($user)]);
    }

    public static function logout(): never
    {
        if (Request::method() !== 'POST') {
            Response::error('Método não permitido', 405);
        }
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $p['path'],
                $p['domain'],
                (bool) $p['secure'],
                (bool) $p['httponly']
            );
        }
        session_destroy();
        Response::json(['ok' => true]);
    }

    public static function me(): never
    {
        if (Request::method() !== 'GET') {
            Response::error('Método não permitido', 405);
        }
        $user = Auth::requireLogin();
        Response::json(['user' => self::enrichUser($user)]);
    }

    public static function register(): never
    {
        if (Request::method() !== 'POST') {
            Response::error('Método não permitido', 405);
        }
        $body = Request::jsonBody();
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $gymId = isset($body['gym_id']) ? (int) $body['gym_id'] : 0;

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('E-mail inválido', 422);
        }
        if (strlen($password) < 6) {
            Response::error('Senha deve ter pelo menos 6 caracteres', 422);
        }
        if ($gymId <= 0) {
            Response::error('Selecione a academia', 422);
        }

        $stmt = Database::pdo()->prepare('SELECT id FROM gyms WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $gymId]);
        if ($stmt->fetchColumn() === false) {
            Response::error('Academia não encontrada', 404);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        $pdo = Database::pdo();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO users (email, password_hash, role, status)
                 VALUES (:email, :ph, :role, :st)'
            );
            $stmt->execute([
                'email' => $email,
                'ph' => $hash,
                'role' => 'member',
                'st' => 'pending',
            ]);
            $userId = (int) $pdo->lastInsertId();

            $stmt = $pdo->prepare(
                'INSERT INTO memberships (gym_id, user_id, status) VALUES (:gid, :uid, :st)'
            );
            $stmt->execute([
                'gid' => $gymId,
                'uid' => $userId,
                'st' => 'pending',
            ]);
            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            if (($e->errorInfo[0] ?? '') === '23505') {
                Response::error('Este e-mail já está cadastrado', 409);
            }
            throw $e;
        }

        Response::json([
            'message' => 'Cadastro criado. Aguarde a aprovação do dono da academia.',
            'user_id' => $userId,
        ], 201);
    }

    /** @param array<string, mixed> $user */
    private static function enrichUser(array $user): array
    {
        $role = (string) ($user['role'] ?? '');
        $out = [
            'id' => (int) $user['id'],
            'email' => (string) $user['email'],
            'role' => $role,
            'status' => (string) ($user['status'] ?? ''),
        ];

        if ($role === 'owner') {
            $stmt = Database::pdo()->prepare(
                'SELECT g.id, g.name FROM gyms g WHERE g.owner_user_id = :uid LIMIT 1'
            );
            $stmt->execute(['uid' => (int) $user['id']]);
            $gym = $stmt->fetch(PDO::FETCH_ASSOC);
            $out['gym'] = $gym === false ? null : $gym;
        }

        if ($role === 'member') {
            $stmt = Database::pdo()->prepare(
                'SELECT g.id, g.name, m.status AS membership_status
                 FROM memberships m
                 JOIN gyms g ON g.id = m.gym_id
                 WHERE m.user_id = :uid
                 LIMIT 1'
            );
            $stmt->execute(['uid' => (int) $user['id']]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row !== false) {
                $out['gym'] = ['id' => (int) $row['id'], 'name' => (string) $row['name']];
                $out['membership_status'] = (string) $row['membership_status'];
            } else {
                $out['gym'] = null;
            }
        }

        return $out;
    }
}
