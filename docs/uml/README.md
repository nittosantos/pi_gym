# Documentação UML / BPMN

Índice dos diagramas do **Portal Academia Ge Ribeiro**.

## Arquivos

| Tipo | Markdown (leitura no Git) | PlantUML (exportar PNG/SVG) |
|------|---------------------------|-----------------------------|
| **Casos de uso** | [casos-de-uso.md](casos-de-uso.md) | [casos-de-uso.puml](casos-de-uso.puml) |
| **Classes** | [diagrama-classes.md](diagrama-classes.md) | [diagrama-classes.puml](diagrama-classes.puml) |
| **Sequência** | [diagrama-sequencia.md](diagrama-sequencia.md) | [diagrama-sequencia.puml](diagrama-sequencia.puml) |
| **BPMN** | [diagrama-bpmn.md](diagrama-bpmn.md) | [bpmn-cadastro-aprovacao.puml](bpmn-cadastro-aprovacao.puml), [bpmn-registro-treino.puml](bpmn-registro-treino.puml), [bpmn-suspensao-reativacao.puml](bpmn-suspensao-reativacao.puml), [bpmn-gestao-treinos.puml](bpmn-gestao-treinos.puml) |

## Modelagem de dados (complementar)

- [modelo-conceitual.md](../modelagem/modelo-conceitual.md)
- [modelo-logico.md](../modelagem/modelo-logico.md)
- [modelo-fisico.md](../modelagem/modelo-fisico.md)
- [dicionario-dados.md](../modelagem/dicionario-dados.md)

## Imagens prontas (PNG)

As imagens exportadas ficam em **`docs/diagramas/imagens/`** (11 arquivos).

Para regenerar:

```bash
bash docs/diagramas/gerar-imagens.sh
```

Ver também: [docs/diagramas/README.md](../diagramas/README.md)

## Como gerar imagens manualmente

1. Instale a extensão **PlantUML** no VS Code/Cursor, **ou**
2. Cole o conteúdo de um `.puml` em https://www.plantuml.com/plantuml/uml
3. Exporte **PNG** ou **SVG** e salve em `docs/diagramas/imagens/`

Os arquivos `.md` contêm versões **Mermaid** para visualização rápida no GitHub/editor; para notação UML/BPMN formal na banca, prefira os `.puml` ou os PNG gerados.
