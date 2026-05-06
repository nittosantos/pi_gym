<?php

declare(strict_types=1);

namespace App;

/** Motivos genéricos de suspensão (chave → rótulo para UI e armazenamento). */
final class MembershipSuspension
{
    public const REASONS = [
        'inadimplencia' => 'Inadimplência',
        'pausa_plano' => 'Pausa / congelamento de plano',
        'solicitacao_academia' => 'A pedido da academia',
        'outros' => 'Outros (regularize na recepção)',
    ];

    public static function label(?string $key): ?string
    {
        if ($key === null || $key === '') {
            return null;
        }

        return self::REASONS[$key] ?? $key;
    }

    public static function isValidKey(string $key): bool
    {
        return isset(self::REASONS[$key]);
    }
}
