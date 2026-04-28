# Modelo Lógico

Modelo relacional (independente de detalhes físicos do SGBD).

## Relações

### USERS
- **PK:** `id`
- Atributos: `email`, `password_hash`, `role`, `status`, `created_at`
- Restrições:
  - `email` único
  - `role` em (`owner`, `member`)
  - `status` em (`active`, `pending`)

### GYMS
- **PK:** `id`
- **FK:** `owner_user_id -> USERS.id`
- Atributos: `name`
- Restrições:
  - `owner_user_id` único (um dono por academia no escopo do projeto)

### MEMBERSHIPS
- **PK:** `id`
- **FKs:** `gym_id -> GYMS.id`, `user_id -> USERS.id`
- Atributos: `status`, `created_at`
- Restrições:
  - `status` em (`active`, `pending`)
  - `UNIQUE(gym_id, user_id)` (um vínculo por academia/aluno)

### WORKOUTS
- **PK:** `id`
- **FKs:** `gym_id -> GYMS.id`, `member_user_id -> USERS.id`
- Atributos: `title`, `content`, `created_at`, `updated_at`

### CHECKINS
- **PK:** `id`
- **FKs:** `gym_id -> GYMS.id`, `member_user_id -> USERS.id`, `workout_id -> WORKOUTS.id (nullable)`
- Atributos: `checked_in_at`, `checked_out_at`
- Restrições:
  - `checked_out_at IS NULL OR checked_out_at >= checked_in_at`

## Cardinalidades Lógicas

- `USERS (owner)` 1 : 1 `GYMS`
- `GYMS` 1 : N `MEMBERSHIPS`
- `USERS (member)` 1 : N `MEMBERSHIPS`
- `USERS (member)` 1 : N `WORKOUTS`
- `GYMS` 1 : N `WORKOUTS`
- `USERS (member)` 1 : N `CHECKINS`
- `GYMS` 1 : N `CHECKINS`
- `WORKOUTS` 1 : N `CHECKINS` (opcional no lado de checkins)
