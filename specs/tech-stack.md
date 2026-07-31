# Tech Stack — AI Hub

## Restrição inegociável: zero dependências no front

SPA **100% estática**: HTML5 + CSS3 + JavaScript puro. Sem framework, sem bundler, sem
build step, sem `node_modules` servido ao browser.

**Por quê:** deploy em qualquer lugar (GitHub Pages, Netlify, Nginx, S3, Cloud Storage) sem
pipeline. Um `git push` publica. Adicionar build é reabrir uma decisão fechada — exige
aprovação explícita.

## Componentes

| Camada | Tecnologia | Observações |
|---|---|---|
| Markup | `index.html` | Todas as 7 views no mesmo arquivo, uma ativa por vez |
| Estilo | `styles.css` | Design system em variáveis CSS; dark/light; fontes Inter + Outfit |
| Lógica | `app.js` | **Script clássico** (`<script src="app.js">`), não ES module |
| Dados | `models-data.json` | Fonte única: modelos, benchmarks, guias de prompting, dicas |
| Ingestão | `scripts/update-prices.mjs` | Node ESM, `fetch` nativo, **zero deps** |
| CI | `.github/workflows/update-prices.yml` | Segunda 06:00 UTC + `workflow_dispatch` |

**Node.js >= 18** — só para o script de ingestão e o CI. Nunca para servir o front.

## Gráficos

Radar chart **desenhado à mão em SVG** em `app.js`. Nenhuma biblioteca de chart é aprovada.
Barras da calculadora são `div` com `width` percentual.

## Roteamento

Hash-based, client-side, em `app.js:687-703`. `currentRoute()` lê `location.hash`,
`showView()` alterna a classe `.active` entre os `.view` e os links da nav.
Rotas: `#catalog` `#matcher` `#compare` `#benchmarks` `#governance` `#guidelines` `#calculator`.

## Fonte de dados externa

**OpenRouter API** (`https://openrouter.ai/api/v1/models`) — pública, **sem API key**, sem
secret no CI. Casa pelo campo `openrouterId` de cada modelo.

Atualiza **apenas** `price.input`, `price.output` e `context`. **Preserva** scores, ELO e
governança. Modelo sem correspondência é pulado e logado, mantendo o valor curado.

Fontes descartadas e por quê: *HF Open LLM Leaderboard* foi arquivado; *LMSYS Arena* não tem
API pública estável (o ELO entra curado à mão).

## Comandos

```bash
npm run serve              # python3 -m http.server 8765
npm run update-prices:dry  # mostra o diff sem escrever
npm run update-prices      # atualiza models-data.json
```

> Precisa de servidor local: `app.js` faz `fetch('models-data.json')` e `file://` é
> bloqueado por CORS.

## Validação

**Não existe framework de teste no projeto.** A verificação é sintática + manual:

```bash
node --check app.js                                        # sintaxe do front
node --check scripts/update-prices.mjs                     # sintaxe do script
python3 -c "import json;json.load(open('models-data.json'))"  # JSON válido
npm run update-prices:dry                                  # ingestão sem escrever
```

Introduzir um test runner é decisão em aberto — hoje seria a primeira dependência do
projeto. Ver `roadmap.md`.

## Convenções de dado

- Chaves em **camelCase** (`lastVerified`, `openrouterId`, `priceVerified`).
  O plano original usava `last_verified`; o projeto padronizou camelCase.
- Preço sempre **por 1M tokens**, em USD.
- Todo campo automatizado anda com o par fonte + data.
- Conteúdo editorial (benchmarks, guias, dicas) mora no JSON, **nunca hardcoded** no `app.js`.

## Ao adicionar um modelo

Incluir `openrouterId` com o slug da OpenRouter (ex.: `anthropic/claude-sonnet-4.6`) e rodar
`update-prices:dry` para confirmar que casou.
