# Roadmap — AI Hub

Fases 1–3 foram executadas em 30/07/2026 antes deste arquivo existir; estão registradas
aqui retroativamente, com os deltas em relação ao plano original.

---

## Fase 1 — Catálogo, decisão e custo

- [x] SPA estática com nav e 5 rotas (`#catalog`, `#matcher`, `#compare`, `#benchmarks`, `#calculator`)
- [x] Catálogo com busca instantânea, category pills e cards (badge, ELO, preço, contexto, latência, throughput)
- [x] Selo de verificação com fonte e data em cada card
- [x] Smart Matcher — wizard de 3 passos → shortlist com principal + alternativa econômica e o *porquê*
- [x] Comparador lado a lado (até 3 modelos) com destaque do melhor por métrica
- [x] Radar SVG desenhado à mão (raciocínio, código, conhecimento, velocidade, custo)
- [x] Calculadora de custo reativa, ordenada do mais barato ao mais caro
- [x] Modal de métricas com scores normalizados e eixo de governança
- [x] Rota Benchmarks — 10 benchmarks em 6 categorias, cada um com "o que mede", "use quando" e "⚠️ cuidado"
- [x] Toggle de tema claro/escuro com `localStorage`, respeitando `prefers-color-scheme`, sem flash

**Deltas vs. plano original:** o plano previa só dark mode (toggle foi pedido depois) e não
previa Smart Matcher nem a rota Benchmarks — ambos entraram como escopo adicional.

---

## Fase 2 — Preço real automatizado

- [x] `scripts/update-prices.mjs` — Node puro, `fetch` nativo, zero dependências
- [x] Casamento por `openrouterId` contra `openrouter.ai/api/v1/models` (público, sem key)
- [x] Atualiza só `price` e `context`; preserva scores, ELO e governança
- [x] Modelos sem correspondência pulados e logados, mantendo o valor curado
- [x] Flag `--dry-run` para revisar o diff antes de escrever
- [x] `.github/workflows/update-prices.yml` — segunda 06:00 UTC + `workflow_dispatch`, commita só se houve diff
- [x] Proveniência separada por campo: `priceSource`/`priceVerified` vs. `source`/`lastVerified`
- [x] Modal exibindo as duas datas distintas
- [x] Scripts npm: `serve`, `update-prices`, `update-prices:dry`

**Deltas vs. plano original:** o plano colocava a automação na Fase 3 — foi antecipada. A
proveniência por campo é mais granular que o `last_verified` único previsto.

---

## Fase 3 — Governança e prompting

- [x] `governance` estruturada: `selfHost`, `zeroRetention`, `dataResidency`, `dpa`, `certifications[]`, `retention`, `regions`, `trainsOnData`
- [x] Rota `#governance` — matriz de compliance com ✓/✗ coloridos
- [x] Filtros por requisito real: self-host, HIPAA (BAA), residência EU, SOC 2
- [x] Rota `#guidelines` — dicas gerais + guias por família via `promptFamily`
- [x] Snippets copiáveis (clipboard) e link para a doc oficial de cada família
- [x] Campos de governança refletidos no modal de cada card
- [x] Roteamento client-side por hash — cada rota virou camada própria, fim do scroll infinito
- [x] Remoção completa do termo "chapter" / "AI Chapter" do projeto
- [x] Marca reduzida a logo **AI** + **Model Hub**
- [x] README reescrito como documento geral do projeto

**Deltas vs. plano original:** governança era só um badge no card da Fase 1 — virou rota com
matriz filtrável. A reorganização em camadas não estava prevista; veio de feedback de UX.

---

## Fase 4 — Fechar as lacunas enterprise

Os três itens do plano original que não chegaram ao dado. Todos vivem no bloco
`governance` e já têm onde aparecer (matriz + filtros + badges do card).

- [ ] Adicionar `lgpd` ao `governance` dos 12 modelos — hoje as `certifications` cobrem GDPR, CCPA, SOC 2, ISO 27001, HIPAA e CSA STAR, e **nenhum modelo menciona LGPD**
- [ ] Adicionar `cloudProviders[]` estruturado (Azure OpenAI, AWS Bedrock, Vertex AI, Direct API) — hoje `Azure` e `Bedrock` não aparecem no JSON e `Vertex` só existe como texto solto em `regions` de dois modelos Gemini
- [ ] Exibir os provedores cloud como badge no card do catálogo
- [ ] Adicionar coluna LGPD e coluna de provedores à matriz de governança
- [ ] Criar filtro por provedor cloud e filtro LGPD na rota `#governance`
- [ ] Adicionar a categoria **Enterprise Ready** às pills do catálogo — o plano previa a pill, mas o eixo enterprise virou só o badge "EU / Compliance", que não filtra
- [ ] Atualizar `lastVerified` dos modelos tocados e o `meta` do JSON

**Fora de escopo desta fase:** curadoria dos scores de qualidade e deploy — ficam na Fase 5.

---

## Fase 5 — Publicar e tornar os dados confiáveis

- [ ] Deploy no GitHub Pages a partir de `main`
- [ ] Substituir os scores ilustrativos por dados curados de fontes reais (Artificial Analysis, papers, model cards)
- [ ] Registrar a fonte real em `source` e a data em `lastVerified` de cada modelo
- [ ] Remover o disclaimer de "scores ilustrativos" só quando a curadoria estiver completa
- [ ] Decidir o naming pendente: padronizar "Model Hub" no rodapé, `<title>` e README, ou manter "AI Hub" como nome do produto
- [ ] Avaliar se vale introduzir um test runner — hoje a validação é `node --check` + JSON + walkthrough manual, e um runner seria a primeira dependência do projeto

---

## Backlog (sem fase)

- Gráficos comparativos na calculadora — o plano original pedia "tabela e gráficos"; hoje há tabela com barras
- Exportar comparação em PDF/imagem para colar em RFC
- Histórico de preço por modelo (a Action já roda semanal; daria série temporal)
- Migrar para backend só se aparecer necessidade de auth, favoritos por usuário ou dado interno sensível
