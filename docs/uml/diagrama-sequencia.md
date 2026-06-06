# Diagramas de Sequência

Fluxos principais da API (sessão PHP, JSON). Participantes: **Cliente** (navegador), **API** (PHP), **BD** (PostgreSQL).

**Diagramas UML (exportáveis):** [`diagrama-sequencia.puml`](diagrama-sequencia.puml) — quatro fluxos em um arquivo.

---

## 1. Login e sessão

```mermaid
sequenceDiagram
  actor Cliente
  participant API as API (AuthController)
  participant BD as PostgreSQL

  Cliente->>API: POST /auth/login { email, password }
  API->>BD: SELECT user por email
  BD-->>API: registro + hash
  API->>API: password_verify
  API->>API: session user_id
  API-->>Cliente: 200 { user }
```

---

## 2. Cadastro de aluno + aprovação pelo dono

```mermaid
sequenceDiagram
  actor Aluno as Cliente (cadastro)
  actor Dono as Cliente (dono)
  participant API as API
  participant BD as PostgreSQL

  Aluno->>API: POST /auth/register { gym_id, email, password }
  API->>BD: INSERT users + memberships (pending)
  API-->>Aluno: 201

  Dono->>API: POST /owner/members/{id}/approve
  API->>BD: verifica status = pending
  API->>BD: CALL sp_approve_member
  BD-->>API: ok
  API-->>Dono: 200
```

---

## 3. Registro de treino do dia

```mermaid
sequenceDiagram
  actor Aluno
  participant API as MemberController
  participant Auth as Auth
  participant BD as PostgreSQL

  Aluno->>API: POST /member/training-records
  API->>Auth: requireActiveMember()
  Auth->>BD: membership = active
  BD-->>Auth: ok
  API->>API: valida data (Brasília), horários, workout
  API->>BD: INSERT checkins
  BD->>BD: trigger checkins_validate_times
  BD-->>API: RETURNING row
  API-->>Aluno: 201 { record }
```

---

## 4. Aluno suspenso: leitura vs escrita

```mermaid
sequenceDiagram
  actor Aluno as Cliente (aluno)
  participant API as MemberController
  participant Auth as Auth
  participant BD as PostgreSQL

  Aluno->>API: GET /member/workouts
  API->>Auth: requireMemberRead()
  Auth->>BD: membership IN (active, suspended)
  BD-->>Auth: ok
  API->>BD: SELECT workouts
  API-->>Aluno: 200 { workouts }

  Aluno->>API: POST /member/training-records
  API->>Auth: requireActiveMember()
  Auth->>BD: membership = suspended
  Auth-->>API: 403
  API-->>Aluno: 403 mensagem de suspensão
```

---

## Como exportar

Cada bloco `@startuml` em [`diagrama-sequencia.puml`](diagrama-sequencia.puml) pode ser exportado separadamente como PNG/SVG para o relatório acadêmico.
