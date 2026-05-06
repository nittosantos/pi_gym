# Modelo Físico (PostgreSQL)

Implementação física baseada em PostgreSQL 16.

## Tabelas e Tipos

- Chaves primárias: `SERIAL`
- Datas: `TIMESTAMPTZ`
- Textos:
  - `VARCHAR(255)` para e-mail
  - `VARCHAR(200)` para títulos e nome de academia
  - `TEXT` para conteúdo livre de treino

## Integridade e Objetos do Banco

- **Constraints**
  - `CHECK` para domínios (`role`, `status`)
  - `UNIQUE` em `users.email` e `memberships(gym_id, user_id)`
  - `CHECK` temporal em `checkins`:
    - `checked_out_at IS NULL OR checked_out_at >= checked_in_at`

- **FKs e regras de deleção**
  - `ON DELETE CASCADE` para vínculos centrais (`memberships`, `workouts`, `checkins`)
  - `ON DELETE SET NULL` para `checkins.workout_id` (preserva histórico mesmo se treino for removido)

- **Índices**
  - `idx_memberships_gym`, `idx_memberships_user`
  - `idx_workouts_member`, `idx_workouts_gym`
  - `idx_checkins_member`, `idx_checkins_gym`, `idx_checkins_workout`

- **Procedural SQL**
  - Procedure: `sp_approve_member`
  - Functions: `fn_workout_display_title`, `fn_training_duration_minutes`
  - Triggers:
    - `checkins_validate_times`
    - `workouts_touch_updated_at`
  - View:
    - `vw_training_records`

## Fonte Oficial do Modelo Físico

- `database/init.sql` (estrutura completa para banco novo)
- `database/migrate_add_*.sql` (evoluções incrementais)
- `database/migrate_membership_suspended.sql` — estado **suspenso**, coluna `suspension_reason`, atualização da procedure `sp_approve_member`
