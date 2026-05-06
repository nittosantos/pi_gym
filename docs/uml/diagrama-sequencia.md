# Diagramas de Sequência

Fluxos principais da API (sessão PHP, JSON). Participantes genéricos: **Cliente** (navegador), **API** (PHP), **BD** (PostgreSQL).

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
  API->>BD: CALL sp_approve_member
  BD-->>API: ok
  API-->>Dono: 200
```

---

## 3. Suspender aluno (modo consulta)

```mermaid
sequenceDiagram
  actor Dono as Cliente (dono)
  participant API as OwnerController
  participant BD as PostgreSQL

  Dono->>API: POST /owner/members/{id}/suspend { reason }
  API->>BD: SELECT membership status = active
  API->>BD: UPDATE memberships SET suspended + suspension_reason
  API-->>Dono: 200

  Note over Dono,BD: Aluno permanece com conta active; só o vínculo muda para suspended.
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
  Auth->>BD: membership = active
  Auth-->>API: 403 se suspended
  API-->>Aluno: 403 mensagem de suspensão
```

---

**Observação:** Para relatório acadêmico, os mesmos fluxos podem ser redesenhados em ferramenta UML com lifelines nomeadas `Router`, `OwnerController`, etc.; aqui o foco é o comportamento observável do sistema.
