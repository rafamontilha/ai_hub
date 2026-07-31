# 🧭 AI Hub — Benchmark & Recomendação de LLMs

> Portal para os times de engenharia e produto escolherem o modelo de linguagem certo para cada projeto — com base em dados, não em achismo.

Uma **SPA estática** (HTML + CSS + JavaScript puro, **sem nenhuma dependência ou build**) que reúne, em um só lugar, catálogo de modelos, recomendação guiada, comparação técnica, guia de benchmarks, matriz de compliance, boas práticas de prompting e calculadora de custo.

---

## ✨ Visão geral

Escolher um LLM envolve cruzar muitas variáveis — qualidade, custo, latência, contexto, privacidade — que hoje ficam espalhadas por leaderboards, docs de provedores e planilhas. O AI Hub centraliza isso em uma experiência visual (inspirada no Google Skills) e mantém os dados de preço **atualizados automaticamente**.

**Princípio central — dados híbridos honestos:** cada número exibido carrega sua **fonte** e **data de verificação**. Preço/contexto vêm automatizados da OpenRouter; scores de qualidade são curados internamente. Os dois **nunca compartilham a mesma data** — são campos separados, e a UI deixa isso claro.

---

## 🧩 Funcionalidades

| Rota | O que faz |
|---|---|
| **Catálogo** | Cards visuais com badge, ELO, preço, contexto, latência e throughput. Filtros por categoria e busca. |
| **Smart Matcher** | Wizard de 3 perguntas → shortlist rankeada (modelo principal + alternativa econômica) com o *porquê*. |
| **Comparador** | Compara até 3 modelos lado a lado, com tabela que destaca o melhor por métrica + **radar SVG**. |
| **Benchmarks** | Guia explicando o que cada benchmark mede, quando usá-lo como referência de decisão e onde ele engana. |
| **Governança** | Matriz de compliance (self-host, retenção, residência de dados, DPA, certificações) com filtros. |
| **Guidelines** | Boas práticas de prompting + snippets copiáveis por família de modelo (Claude, GPT, Gemini, abertos). |
| **Calculadora** | Estima o custo mensal por modelo a partir do seu volume, ordenado do mais barato ao mais caro. |

Extras de UX: **tema claro/escuro** persistente, glassmorphism, micro-animações, e tudo responsivo.

---

## 🛠️ Stack

- **HTML5 + CSS3 + JavaScript (ES modules) puro** — sem framework, sem bundler, sem `node_modules` no front.
- **Design system** próprio via variáveis CSS (dark/light), fontes *Inter* e *Outfit*.
- **Radar chart** desenhado à mão em SVG (sem bibliotecas de gráfico).
- **Node.js** (só no script de ingestão e no CI) — usa `fetch` nativo, zero dependências.
- **GitHub Actions** para atualização agendada dos preços.

---

## 📁 Estrutura do projeto

```
ai-hub/
├── index.html                       # Estrutura da SPA (todas as rotas/seções)
├── styles.css                       # Design system (dark/light, glassmorphism)
├── app.js                           # Toda a lógica da SPA (render, filtros, wizard, radar…)
├── models-data.json                 # Fonte única de dados: modelos, benchmarks, guias
├── package.json                     # Scripts npm (serve, update-prices)
├── scripts/
│   └── update-prices.mjs            # Ingestão de preço/contexto via OpenRouter API
├── .github/workflows/
│   └── update-prices.yml            # Roda o script semanalmente e commita se mudar
└── README.md
```

---

## 🚀 Como rodar

```bash
cd ai-hub
python3 -m http.server 8765      # ou: npm run serve
# abra http://localhost:8765
```

> É preciso um servidor local: o `app.js` faz `fetch('models-data.json')`, e abrir o
> `index.html` direto via `file://` é bloqueado pela política de CORS do navegador.

---

## 🗃️ Modelo de dados

Tudo vem de **`models-data.json`** (fonte única). Cada modelo tem proveniência por campo:

| Dado | Fonte | Campos |
|---|---|---|
| Preço / contexto | OpenRouter API (automatizado) | `priceSource`, `priceVerified` |
| Scores / ELO | Curadoria interna (ilustrativo no protótipo) | `source`, `lastVerified` |
| Governança | Curadoria por provedor | `governance{ selfHost, zeroRetention, dataResidency, dpa, certifications[]… }` |

O arquivo também guarda o **guia de benchmarks** (`benchmarks`), os **guias de prompting**
(`promptingGuides`) e as **dicas gerais** (`generalTips`) — tudo editável sem tocar no código.

> ⚠️ Os **scores de qualidade são ilustrativos** neste protótipo. Antes de usar em decisão
> real, eles devem ser curados a partir de fontes como Artificial Analysis, papers e model cards.

---

## 🔄 Atualização automática de preços

```bash
npm run update-prices:dry   # mostra o diff sem escrever nada
npm run update-prices       # atualiza models-data.json
```

O script casa cada modelo pelo campo `openrouterId` com a lista pública da
[OpenRouter](https://openrouter.ai/api/v1/models), atualiza `price`/`context`, registra a
proveniência e **preserva** scores e governança. Modelos sem correspondência são pulados
(mantêm o valor curado) e logados.

**CI:** `.github/workflows/update-prices.yml` roda toda segunda 06:00 UTC (e sob demanda),
executa o script e commita **só se houve mudança**. Não precisa de secret — o endpoint é público.

> **Ao adicionar um modelo:** inclua `openrouterId` com o slug da OpenRouter
> (ex.: `anthropic/claude-sonnet-4.6`) e rode `update-prices:dry` para confirmar que casou.

---

## 🗺️ Roadmap

- **Fase 1 ✅** — Catálogo, Smart Matcher, Comparador, Benchmarks e Calculadora + tema claro/escuro.
- **Fase 2 ✅** — Preço/contexto automatizados via OpenRouter API + GitHub Action.
- **Fase 3 ✅** — Matriz de governança/compliance + guia de prompting com snippets por família.
- **Próximos passos** — Deploy (GitHub Pages), curadoria dos scores de qualidade reais.

---

## 🤔 Decisões de projeto (FAQ)

**Por que não "benchmarks em tempo real" de HF/LMSYS?**
- O *HF Open LLM Leaderboard* foi arquivado — não é mais fonte viva.
- A *LMSYS Chatbot Arena* não tem API pública estável (o ELO entra curado à mão).
- A *OpenRouter* é a fonte sólida para preço/contexto/disponibilidade → base da automação.

**Por que SPA estática e não um backend?**
Para o MVP, um site estático + Action agendado entrega "atualizado diariamente" sem infra
para manter. Benchmark não muda de hora em hora. Dá para evoluir para backend depois sem
reescrever o front.

**Por que separar a data de preço da data de qualidade?**
Credibilidade. Misturar as duas faria um dado curado parecer "verificado ao vivo". Cada
número mostra de onde veio e quando foi conferido.

---

## 📌 Status

Protótipo funcional. Preços reais (OpenRouter); scores de qualidade ainda
ilustrativos até a curadoria. Construído como SPA estática, sem dependências no front.
