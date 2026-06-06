# Diagramas BPMN (processos de negócio)

Processos principais do **Portal Academia Ge Ribeiro**, alinhados ao fluxo real (front + API PHP + PostgreSQL).

> **Como exportar:** abra os arquivos `.puml` desta pasta em [PlantUML Online](https://www.plantuml.com/plantuml/uml), VS Code (extensão PlantUML) ou Astah/Draw.io (importar ou redesenhar a partir deste modelo).

---

## Índice de processos

| ID | Processo | Arquivo PlantUML |
|----|----------|------------------|
| BP-01 | Cadastro e aprovação de aluno | `bpmn-cadastro-aprovacao.puml` |
| BP-02 | Registro de treino do dia (aluno) | `bpmn-registro-treino.puml` |
| BP-03 | Suspensão e reativação de vínculo | `bpmn-suspensao-reativacao.puml` |
| BP-04 | Gestão de treinos pelo dono | `bpmn-gestao-treinos.puml` |

---

## BP-01 — Cadastro e aprovação de aluno

**Atores / pools:** Visitante (cadastro), Dono (aprovação), Sistema (API + BD).

```mermaid
flowchart TB
  subgraph Visitante
    A1([Início]) --> A2[Preencher e-mail, senha e academia]
    A2 --> A3[Enviar cadastro]
  end

  subgraph Sistema
    A3 --> B1{E-mail já existe?}
    B1 -->|Sim| B2[/Erro: e-mail em uso/]
    B1 -->|Não| B3[Criar usuário pending + vínculo pending]
    B3 --> B4[/Aguardar aprovação/]
  end

  subgraph Dono
    B4 --> C1[Listar alunos pendentes]
    C1 --> C2{Aprovar?}
    C2 -->|Não| C3([Fim — permanece pendente])
    C2 -->|Sim| C4[CALL sp_approve_member]
    C4 --> C5[Vínculo active + conta active]
    C5 --> C6([Fim — aluno pode usar o portal])
  end
```

---

## BP-02 — Registro de treino do dia

**Pré-condição:** aluno com vínculo **active** (não suspenso).

```mermaid
flowchart TB
  subgraph Aluno
    S1([Início]) --> S2[Selecionar treino, entrada e saída]
    S2 --> S3[Enviar registro]
  end

  subgraph Sistema
    S3 --> V1{Autenticado e vínculo active?}
    V1 -->|Não / suspenso| E1[/403 — modo consulta/]
    V1 -->|Sim| V2{Data = hoje em Brasília?}
    V2 -->|Não| E2[/422 — só dia de hoje/]
    V2 -->|Sim| V3{Saída >= entrada?}
    V3 -->|Não| E3[/422 — horário inválido/]
    V3 -->|Sim| V4{Treino pertence ao aluno?}
    V4 -->|Não| E4[/422 — treino inválido/]
    V4 -->|Sim| I1[INSERT checkins]
    I1 --> T1{Trigger + CHECK horários}
    T1 -->|Falha| E5[/Erro BD/]
    T1 -->|Ok| OK([Fim — registro criado])
  end
```

---

## BP-03 — Suspensão e reativação

```mermaid
flowchart TB
  subgraph Dono
    D1([Início]) --> D2[Selecionar aluno ativo]
    D2 --> D3[Informar motivo da suspensão]
    D3 --> D4[Confirmar suspensão]
  end

  subgraph Sistema
    D4 --> U1[UPDATE membership → suspended]
    U1 --> N1[Aluno: consulta treinos/histórico]
    N1 --> N2[Bloqueia POST training-records]
  end

  subgraph Dono2["Dono (reativação)"]
    R1[Selecionar aluno suspenso] --> R2[Reativar vínculo]
  end

  subgraph Sistema2["Sistema"]
    R2 --> U2[UPDATE membership → active, limpa motivo]
    U2 --> FIM([Fim — registro liberado])
  end

  N2 -.-> R1
```

---

## BP-04 — Gestão de treinos (dono)

```mermaid
flowchart LR
  subgraph Dono
    G1([Início]) --> G2[Escolher aluno]
    G2 --> G3{Ação}
    G3 -->|Criar| G4[POST workout]
    G3 -->|Editar| G5[PATCH workout]
    G3 -->|Excluir| G6[DELETE workout]
    G3 -->|Listar| G7[GET workouts]
  end

  subgraph Sistema
    G4 & G5 & G6 & G7 --> V[Validar dono + aluno da academia]
    V --> BD[(PostgreSQL workouts)]
    BD --> FIM([Fim])
  end
```

---

## Legenda (notação simplificada)

| Símbolo | Significado BPMN |
|---------|------------------|
| `([ ])` | Evento início/fim |
| `[ ]` | Atividade/tarefa |
| `{ }` | Gateway (decisão) |
| `[/ /]` | Evento de mensagem/erro |
| `[( )]` | Armazenamento de dados |

Os arquivos `.puml` na mesma pasta usam **swimlanes** (partições) para aproximar a notação BPMN 2.0 com pools por ator.
