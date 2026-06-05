<?php

declare(strict_types=1);

namespace App;

final class BusinessTimezone
{
    public const ID = 'America/Sao_Paulo';

    public static function zone(): \DateTimeZone
    {
        static $tz = null;
        if (!$tz instanceof \DateTimeZone) {
            $tz = new \DateTimeZone(self::ID);
        }

        return $tz;
    }

    public static function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', self::zone());
    }

    public static function todayIso(): string
    {
        return self::now()->format('Y-m-d');
    }
}
