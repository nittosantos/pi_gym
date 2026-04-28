<?php

declare(strict_types=1);

namespace App;

use PDO;

final class GymsController
{
    public static function index(): never
    {
        $stmt = Database::pdo()->query(
            'SELECT id, name FROM gyms ORDER BY id ASC'
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::json(['gyms' => $rows]);
    }
}
