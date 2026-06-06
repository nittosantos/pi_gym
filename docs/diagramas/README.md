# Imagens dos diagramas

PNG exportados a partir dos arquivos PlantUML em `docs/uml/`.

## Pasta

`docs/diagramas/imagens/` — use estas imagens no relatório, slides ou PDF.

## Índice de imagens

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `casos-de-uso.png` | Casos de uso | Atores e UCs do portal |
| `diagrama-classes-dominio.png` | Classes | Entidades (espelho do banco) |
| `diagrama-classes-aplicacao.png` | Classes | API PHP (`api/src`) |
| `sequencia-login.png` | Sequência | Login e sessão |
| `sequencia-cadastro-aprovacao.png` | Sequência | Cadastro + aprovação |
| `sequencia-registro-treino.png` | Sequência | Registro de treino do dia |
| `sequencia-suspenso.png` | Sequência | Aluno suspenso (leitura vs escrita) |
| `bpmn-cadastro-aprovacao.png` | BPMN | BP-01 |
| `bpmn-registro-treino.png` | BPMN | BP-02 |
| `bpmn-suspensao-reativacao.png` | BPMN | BP-03 |
| `bpmn-gestao-treinos.png` | BPMN | BP-04 |

## Regenerar as imagens

Na raiz do projeto:

```bash
bash docs/diagramas/gerar-imagens.sh
```

Requisito: `curl` e acesso à internet (usa [Kroki](https://kroki.io) para renderizar PlantUML sem instalar Java).

### Alternativa local (Docker)

Se o Docker estiver rodando:

```bash
docker run --rm -v "$(pwd)/docs:/docs" plantuml/plantuml \
  -tpng -o /docs/diagramas/imagens \
  /docs/uml/casos-de-uso.puml \
  /docs/uml/bpmn-*.puml \
  /docs/uml/export/*.puml
```

### Alternativa manual (navegador)

1. Abra https://www.plantuml.com/plantuml/uml
2. Cole o conteúdo de um `.puml` de `docs/uml/`
3. Clique com botão direito na imagem → **Salvar como…**
4. Salve em `docs/diagramas/imagens/` com o mesmo nome do arquivo (`.png`)

### Alternativa VS Code / Cursor

1. Instale a extensão **PlantUML**
2. Abra um `.puml` → `Alt+D` (preview)
3. Export PNG para `docs/diagramas/imagens/`

## Fonte dos diagramas

- Texto/fonte: `docs/uml/*.puml` e `docs/uml/export/*.puml`
- Documentação: `docs/uml/README.md`
