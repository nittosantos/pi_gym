# Diagrama de Classes (domínio)

Visão **orientada a objetos do negócio** (entidades persistentes e relacionamentos). Não lista todas as classes PHP da camada de aplicação (`Controller`, `Router`, etc.) — apenas o **modelo de domínio** espelhado no banco + papéis.

---

## Diagrama UML (domínio)

```mermaid
classDiagram
  direction TB

  class Usuario {
    +int id
    +string email
    +string papel
    +string statusConta
  }

  class Academia {
    +int id
    +string nome
  }

  class AssociacaoAcademia {
    +int id
    +string statusVinculo
    +string motivoSuspensaoOpcional
    +DateTime criadoEm
  }

  class Treino {
    +int id
    +string tituloOpcional
    +string conteudo
    +DateTime criadoEm
    +DateTime atualizadoEm
  }

  class RegistroPresenca {
    +int id
    +DateTime entrada
    +DateTime saidaOpcional
  }

  Usuario "1" --> "0..1" Academia : possui / gerencia como dono
  Academia "1" --> "1" Usuario : owner_user_id

  Usuario "1" --> "*" AssociacaoAcademia : memberships
  Academia "1" --> "*" AssociacaoAcademia : memberships

  Academia "1" --> "*" Treino : workouts
  Usuario "1" --> "*" Treino : destinado ao aluno

  Academia "1" --> "*" RegistroPresenca
  Usuario "1" --> "*" RegistroPresenca
  Treino "0..1" --> "*" RegistroPresenca : workout opcional
```

---

## Papéis (`Usuario.papel`)

| Valor | Significado |
|-------|-------------|
| `owner` | Dono da academia (um registro em `gyms` ligado a este usuário). |
| `member` | Aluno. |

---

## Estados do vínculo (`AssociacaoAcademia.statusVinculo`)

| Valor | Significado |
|-------|-------------|
| `pending` | Aguardando aprovação do dono. |
| `active` | Aprovado; uso completo conforme regras da API. |
| `suspended` | Modo consulta no portal do aluno; sem registrar novos treinos até reativação. |

---

## Camada de aplicação (referência rápida)

Classes PHP principais (não no diagrama acima): `Router`, `AuthController`, `OwnerController`, `MemberController`, `Auth`, `Database`, `Request`, `Response`, `MembershipSuspension`.
