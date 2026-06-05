# Academia MVP (projeto acadêmico)

Monorepo simples com **front** estático (HTML/CSS/JS + Bootstrap), **API** em PHP puro e **PostgreSQL** via Docker.

## Estrutura

- `front/` — páginas HTML e `assets/` (`css/`, `js/` — API, painéis, datas em `America/Sao_Paulo`).
- `api/` — PHP com roteador em `api/public/index.php` (Apache + `mod_rewrite`).
- `database/` — `init.sql` (schema + seed do dono e da Academia Ge Ribeiro).
- `docker/` — imagem PHP + Apache (`pdo_pgsql`).

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose v2.

## Como subir

Na raiz do projeto:

```bash
docker compose up --build
```

Abra no navegador: **http://localhost:8080/**

- Front: `http://localhost:8080/index.html`
- API (exemplo): `http://localhost:8080/api/gyms`

Na primeira execução o Postgres aplica o `database/init.sql` automaticamente.

## Credenciais demo (dono)

- **E-mail:** `owner@gymapp.local`
- **Senha:** `owner123`
- Academia seed: **Academia Ge Ribeiro** (id `1` no banco).

Fluxo sugerido para testar:

1. Entre como dono e aprove alunos pendentes.
2. Em **Cadastro**, crie um aluno (conta vinculada à **Academia Ge Ribeiro**).
3. Volte como dono, **aprove** o aluno.
4. Entre como aluno: veja **treinos** e faça **Registrar Treino** informando horário de **entrada** e **saída** para a **data de hoje**. A saída **não pode ser menor** que a entrada (saída >= entrada).  

## Variáveis de ambiente (API)

O serviço `web` usa (já definidas no `docker-compose.yml`):

| Variável       | Padrão no compose |
|----------------|-------------------|
| `DB_HOST`      | `db`              |
| `DB_PORT`      | `5432`            |
| `DB_NAME`      | `gymapp`          |
| `DB_USER`      | `gym`             |
| `DB_PASSWORD`  | `gym`             |

## API (resumo)

Todas as respostas são JSON. Autenticação: **sessão PHP** (cookie), com `credentials: 'include'` no `fetch`.

| Método | Caminho | Quem |
|--------|---------|------|
| `GET` | `/api/gyms` | Público — lista academias (cadastro) |
| `POST` | `/api/auth/register` | Público — corpo: `email`, `password`, `gym_id` |
| `POST` | `/api/auth/login` | Público — `email`, `password` |
| `POST` | `/api/auth/logout` | Logado |
| `GET` | `/api/auth/me` | Logado |
| `GET` | `/api/owner/members` | Dono |
| `POST` | `/api/owner/members/{id}/approve` | Dono — só com associação **pendente** |
| `POST` | `/api/owner/members/{id}/suspend` | Dono — corpo JSON `{ "reason" }` (chaves: `inadimplencia`, `pausa_plano`, `solicitacao_academia`, `outros`) |
| `POST` | `/api/owner/members/{id}/reactivate` | Dono — aluno com associação **suspensa** volta para **ativa** |
| `GET` | `/api/owner/workouts?member_id=` | Dono |
| `POST` | `/api/owner/workouts` | Dono — `member_user_id`, `content`, `title` (opcional) |
| `PATCH` | `/api/owner/workouts/{id}` | Dono — `content` e/ou `title` |
| `DELETE` | `/api/owner/workouts/{id}` | Dono |
| `GET` | `/api/owner/checkins` | Dono — opcional `?member_id=` |
| `GET` | `/api/member/workouts` | Aluno **ativo** ou **suspenso** (modo consulta) |
| `POST` | `/api/member/training-records` | Aluno com associação **ativa** apenas |
| `GET` | `/api/member/training-history` | Aluno **ativo** ou **suspenso** (consulta) |

O registro de treino do aluno usa **`POST /api/member/training-records`** (entrada + saída + treino no mesmo fluxo). A listagem do dono continua em **`GET /api/owner/checkins`** (tabela `checkins` no banco).

## Mesma origem (front + API)

O Apache serve `front/` na raiz (`/`) e o alias **`/api`** aponta para `api/public/`. Assim o navegador trata tudo como **mesmo host/porta**, sem complicação de CORS para este projeto.

## Banco já existia (sem coluna de saída)

Se você já rodou o projeto **antes** desta alteração e o Postgres está em um volume antigo, aplique:

```bash
docker compose exec -T db psql -U gym -d gymapp < database/migrate_add_checkout.sql
docker compose exec -T db psql -U gym -d gymapp < database/migrate_add_checkin_workout.sql
docker compose exec -T db psql -U gym -d gymapp < database/migrate_add_function_procedure_trigger.sql
docker compose exec -T db psql -U gym -d gymapp < database/migrate_membership_suspended.sql
```

O arquivo `migrate_add_function_procedure_trigger.sql` cria no PostgreSQL os objetos acadêmicos e de apoio:
- **Functions:** `fn_workout_display_title`, `fn_training_duration_minutes`
- **Procedure:** `sp_approve_member`
- **Triggers:** `checkins_validate_times`, `workouts_touch_updated_at`
- **View:** `vw_training_records`

O arquivo `migrate_membership_suspended.sql` adiciona estado **suspenso** na associação, coluna `suspension_reason` e redefine `sp_approve_member` (limpa motivo ao aprovar).

Exemplo de chamada da procedure no `psql`: `CALL sp_approve_member(1, <id_do_aluno>);`

(Em alguns terminais no Windows, use `Get-Content database/migrate_add_checkout.sql | docker compose exec -T db psql -U gym -d gymapp`.)

## Modelagem do banco

Arquivos de apoio para entrega acadêmica:

- Conceitual: `docs/modelagem/modelo-conceitual.md`
- Lógico: `docs/modelagem/modelo-logico.md`
- Físico: `docs/modelagem/modelo-fisico.md`

## Seed extra para apresentação

Para popular dados de demonstração (alunos, treinos e check-ins):

```bash
docker compose exec -T db psql -U gym -d gymapp < database/seed_demo_extra.sql
```

Credenciais dos alunos do seed extra:

- `aluno1@gymapp.local` / `aluno123`
- `aluno2@gymapp.local` / `aluno123`
- `aluno3@gymapp.local` / `aluno123`

## Checklist de validação (requisitos de BD)

Use `docs/sql/demo_queries.sql` no DBeaver ou psql para validar:

1. Funções existentes: `fn_workout_display_title`, `fn_training_duration_minutes`
2. Procedure existente: `sp_approve_member`
3. Triggers existentes: `checkins_validate_times`, `workouts_touch_updated_at`
4. View de relatório: `vw_training_records`
5. Regra temporal de check-ins (constraint + trigger)

Exemplo de chamada manual da procedure:

```sql
CALL sp_approve_member(1, 2);
```

## Postman / testes de API

Importe a collection:

- `docs/postman/Academia-MVP.postman_collection.json`

Fluxo sugerido:

1. Login owner
2. Listar membros / aprovar membro
3. Criar treino para membro
4. Login member
5. Registrar treino
6. Consultar histórico e check-ins do owner

## Timezone e datas

- Colunas de data/hora no PostgreSQL usam **`TIMESTAMPTZ`** (instante absoluto; o banco armazena em UTC internamente).
- **Regra de negócio:** fuso **`America/Sao_Paulo`** (horário de Brasília) em toda a aplicação:
  - **API:** `App\BusinessTimezone` (`api/src/BusinessTimezone.php`) e `date_default_timezone_set` no bootstrap.
  - **Validação:** registro de treino só aceita o **dia de hoje** calculado em Brasília (`MemberController::registerTrainingRecord`).
  - **Front:** `front/assets/js/datetime-br.js` — exibição, “hoje” no formulário e métricas (ex.: check-ins do dono).
- Horários exibidos nas telas seguem Brasília independentemente do fuso do navegador ou do SO.

## Solução de problemas

### Login do dono não funciona

O seed usa `pgcrypto` (`crypt(..., gen_salt('bf'))`). Na prática costuma funcionar com `password_verify` do PHP; se na sua máquina falhar, atualize o hash manualmente:

```bash
docker compose exec web php -r "echo password_hash('owner123', PASSWORD_DEFAULT), PHP_EOL;"
```

Copie a string e execute no Postgres (via `docker compose exec db psql -U gym -d gymapp`):

```sql
UPDATE users SET password_hash = 'COLE_AQUI' WHERE email = 'owner@gymapp.local';
```

### Porta 5432 já em uso

Altere o mapeamento no `docker-compose.yml` (ex.: `"5433:5432"`) ou pare o Postgres local.

## Parar e limpar volumes

```bash
docker compose down -v
```

Isso apaga o volume `pgdata` e **zera o banco** na próxima subida.
