<?php

declare(strict_types=1);

namespace App;

use PDOException;
use Throwable;

final class Router
{
    public static function dispatch(): never
    {
        try {
            $method = Request::method();
            $path = Request::path();
            if ($path !== '/' && str_ends_with($path, '/')) {
                $path = rtrim($path, '/') ?: '/';
            }

            if ($method === 'GET' && $path === '/gyms') {
                GymsController::index();
            }
            if ($method === 'POST' && $path === '/auth/login') {
                AuthController::login();
            }
            if ($method === 'POST' && $path === '/auth/logout') {
                AuthController::logout();
            }
            if ($method === 'GET' && $path === '/auth/me') {
                AuthController::me();
            }
            if ($method === 'POST' && $path === '/auth/register') {
                AuthController::register();
            }

            if ($method === 'GET' && $path === '/owner/members') {
                OwnerController::members();
            }
            if ($method === 'POST' && preg_match('#^/owner/members/(\d+)/approve$#', $path, $m)) {
                OwnerController::approveMember((int) $m[1]);
            }
            if ($method === 'POST' && preg_match('#^/owner/members/(\d+)/suspend$#', $path, $m)) {
                OwnerController::suspendMember((int) $m[1]);
            }
            if ($method === 'POST' && preg_match('#^/owner/members/(\d+)/reactivate$#', $path, $m)) {
                OwnerController::reactivateMember((int) $m[1]);
            }
            if (($method === 'GET' || $method === 'POST') && $path === '/owner/workouts') {
                OwnerController::workouts();
            }
            if (preg_match('#^/owner/workouts/(\d+)$#', $path, $m)) {
                OwnerController::workoutById((int) $m[1]);
            }
            if ($method === 'GET' && $path === '/owner/checkins') {
                OwnerController::checkins();
            }

            if ($method === 'GET' && $path === '/member/workouts') {
                MemberController::workouts();
            }
            if ($method === 'POST' && $path === '/member/checkins') {
                MemberController::checkin();
            }
            if ($method === 'POST' && $path === '/member/checkout') {
                MemberController::checkout();
            }
            if ($method === 'POST' && $path === '/member/training-records') {
                MemberController::registerTrainingRecord();
            }
            if ($method === 'GET' && $path === '/member/training-history') {
                MemberController::trainingHistory();
            }

            Response::error('Rota não encontrada', 404);
        } catch (PDOException) {
            Response::error('Erro ao acessar o banco de dados', 500);
        } catch (Throwable $e) {
            error_log((string) $e);
            Response::error('Erro interno do servidor', 500);
        }
    }
}
