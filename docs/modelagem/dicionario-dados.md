# Dicionário de Dados

Descrição dos artefatos persistidos no PostgreSQL. Fonte normativa: `database/init.sql` e migrações aplicadas (`database/migrate_*.sql`).

---

## `users`

| Campo          | Tipo           | Nulo | Restrições / Domínio                         | Descrição |
|----------------|----------------|------|----------------------------------------------|-----------|
| `id`           | SERIAL (PK)    | Não  | —                                            | Identificador interno do usuário. |
| `email`        | VARCHAR(255)   | Não  | UNIQUE                                       | Login do usuário. |
| `password_hash`| TEXT           | Não  | —                                            | Hash da senha (`password_hash` PHP). |
| `role`         | VARCHAR(20)    | Não  | `owner` \| `member`                        | Papel no sistema. |
| `status`       | VARCHAR(20)    | Não  | `active` \| `pending`                        | Estado da conta (cadastro liberado ou pendente de aprovação inicial). |
| `created_at`   | TIMESTAMPTZ    | Não  | DEFAULT NOW()                                | Criação do registro. |

---

## `gyms`

| Campo           | Tipo         | Nulo | Restrições / Domínio      | Descrição |
|-----------------|--------------|------|---------------------------|-----------|
| `id`            | SERIAL (PK)  | Não  | —                         | Identificador da academia. |
| `name`          | VARCHAR(200) | Não  | —                         | Nome exibido (ex.: Academia Ge Ribeiro). |
| `owner_user_id` | INT (FK)     | Não  | UNIQUE → `users.id`       | Usuário dono da academia (1:1 no escopo do projeto). |

---

## `memberships`

| Campo               | Tipo         | Nulo | Restrições / Domínio                                        | Descrição |
|---------------------|--------------|------|-------------------------------------------------------------|-----------|
| `id`                | SERIAL (PK)  | Não  | —                                                           | Identificador do vínculo. |
| `gym_id`            | INT (FK)     | Não  | → `gyms.id`                                                 | Academia. |
| `user_id`           | INT (FK)     | Não  | → `users.id`                                                | Aluno (`member`). |
| `status`            | VARCHAR(20)  | Não  | `pending` \| `active` \| `suspended`                       | Estado do vínculo na academia. |
| `suspension_reason` | VARCHAR(40)  | Sim  | Chaves definidas na API (`MembershipSuspension`) quando suspenso | Motivo genérico da suspensão (opcional na UI do dono). |
| `created_at`        | TIMESTAMPTZ  | Não  | DEFAULT NOW()                                               | Data do vínculo. |

Restrição adicional: `UNIQUE(gym_id, user_id)`.

---

## `workouts`

| Campo             | Tipo          | Nulo | Restrições / Domínio | Descrição |
|-------------------|---------------|------|----------------------|-----------|
| `id`              | SERIAL (PK)   | Não  | —                    | Identificador do treino. |
| `gym_id`          | INT (FK)      | Não  | → `gyms.id`          | Academia. |
| `member_user_id`| INT (FK)      | Não  | → `users.id`         | Aluno destinatário do plano. |
| `title`           | VARCHAR(200)  | Sim  | —                    | Título opcional. |
| `content`         | TEXT          | Não  | —                    | Texto do treino. |
| `created_at`      | TIMESTAMPTZ   | Não  | DEFAULT NOW()        | Criação. |
| `updated_at`      | TIMESTAMPTZ   | Não  | DEFAULT NOW()        | Última atualização (mantida por trigger). |

---

## `checkins`

| Campo             | Tipo          | Nulo | Restrições / Domínio | Descrição |
|-------------------|---------------|------|----------------------|-----------|
| `id`              | SERIAL (PK)   | Não  | —                    | Registro de presença / treino realizado. |
| `gym_id`          | INT (FK)      | Não  | → `gyms.id`          | Academia. |
| `member_user_id`  | INT (FK)      | Não  | → `users.id`         | Aluno. |
| `workout_id`      | INT (FK)      | Sim  | → `workouts.id` ON DELETE SET NULL | Treino associado (opcional). |
| `checked_in_at`   | TIMESTAMPTZ   | Não  | DEFAULT NOW()        | Entrada. |
| `checked_out_at`  | TIMESTAMPTZ   | Sim  | ≥ `checked_in_at` se não nulo | Saída. |

---

## Objetos derivados (referência)

| Objeto | Tipo | Descrição breve |
|--------|------|-----------------|
| `sp_approve_member` | PROCEDURE | Ativa vínculo e conta do aluno; limpa `suspension_reason`. |
| `fn_workout_display_title` | FUNCTION | Rótulo do treino para relatórios. |
| `fn_training_duration_minutes` | FUNCTION | Duração entre entrada e saída. |
| `vw_training_records` | VIEW | Visão de registros para consultas. |
| Triggers em `checkins`, `workouts` | TRIGGER | Validação temporal e `updated_at`. |
