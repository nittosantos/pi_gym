# Modelo Conceitual

Este modelo representa as entidades de negócio do sistema de academia e seus relacionamentos principais.

## Entidades e Regras

- **Usuário (`users`)**
  - Pode ser `owner` (dono) ou `member` (aluno).
  - Possui status (`active`/`pending`) e credenciais.
- **Academia (`gyms`)**
  - Cada academia possui exatamente um dono (`owner_user_id`).
- **Associação (`memberships`)**
  - Liga aluno a academia.
  - Controla status de aprovação do aluno na academia.
- **Treino (`workouts`)**
  - É cadastrado para um aluno específico dentro de uma academia.
- **Registro de treino / Check-in (`checkins`)**
  - Registra entrada e saída do aluno em um dia.
  - Pode referenciar o treino realizado (`workout_id`).

## Diagrama Conceitual (ER)

```mermaid
erDiagram
  USERS ||--o| GYMS : "owner"
  USERS ||--o{ MEMBERSHIPS : "possui"
  GYMS ||--o{ MEMBERSHIPS : "tem"
  USERS ||--o{ WORKOUTS : "recebe"
  GYMS ||--o{ WORKOUTS : "contém"
  USERS ||--o{ CHECKINS : "realiza"
  GYMS ||--o{ CHECKINS : "ocorre em"
  WORKOUTS ||--o{ CHECKINS : "pode ser usado em"

  USERS {
    int id PK
    string email
    string role
    string status
  }
  GYMS {
    int id PK
    string name
    int owner_user_id FK
  }
  MEMBERSHIPS {
    int id PK
    int gym_id FK
    int user_id FK
    string status
  }
  WORKOUTS {
    int id PK
    int gym_id FK
    int member_user_id FK
    string title
    text content
  }
  CHECKINS {
    int id PK
    int gym_id FK
    int member_user_id FK
    int workout_id FK
    datetime checked_in_at
    datetime checked_out_at
  }
```
