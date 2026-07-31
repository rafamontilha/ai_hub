# Mission — AI Hub

## O que é

Portal interno para times de engenharia e produto escolherem o modelo de linguagem certo
para cada projeto **com base em dados, não em achismo**.

Hoje a decisão exige cruzar qualidade, custo, latência, contexto e privacidade — variáveis
espalhadas por leaderboards, docs de provedor e planilhas soltas. O AI Hub centraliza isso
em uma experiência visual única, inspirada no Google Skills.

## Para quem

| Público | O que vem buscar |
|---|---|
| Engenharia | Qual modelo aguenta o caso de uso, a que custo e com que latência |
| Produto | Comparação inteligível sem jargão de benchmark |
| Compliance / Segurança | Se o modelo pode tocar em dado sensível — retenção, residência, certificações |

## Princípio central — dados híbridos honestos

**Todo número exibido carrega sua fonte e sua data de verificação.**

Preço e contexto são automatizados (OpenRouter API). Scores de qualidade e governança são
curados internamente. Os dois **nunca compartilham a mesma data** — são campos separados
(`priceSource`/`priceVerified` vs. `source`/`lastVerified`) e a UI mostra as duas datas
distintas.

**Por quê:** misturar as datas faria um dado curado parecer "verificado ao vivo". A
credibilidade técnica do portal depende de nunca fingir frescor que o dado não tem.
Enquanto os scores forem ilustrativos, o disclaimer fica visível.

## Decisões de produto já fechadas

- **Recomendação é shortlist, não vencedor único.** O Smart Matcher devolve um modelo
  principal **e** uma alternativa econômica, sempre com o *porquê*. Decisão de modelo tem
  trade-off; esconder isso atrás de um "vencedor" seria desonesto.
- **O guia de benchmarks diz onde o benchmark engana.** Um número sem a ressalva leva a
  decisão errada — a seção "⚠️ Cuidado" é o item mais valioso da rota.
- **Governança é eixo de primeira classe**, não rodapé. É o que diferencia de um
  leaderboard público qualquer.
- **Uma rota = uma camada.** Nada de página infinita empilhando seções; a nav troca a view
  e mostra uma por vez.

## Tom e copy

- **Português do Brasil**, direto, sem marketês. Frase curta.
- **Nunca prometer precisão que o dado não tem.** Se é ilustrativo, está escrito que é.
- Termos técnicos em inglês quando são o nome real (RAG, self-host, zero-retention, DPA);
  o resto em português.
- **Proibido o termo "chapter" / "AI Chapter"** — foi removido de todo o projeto.
- Marca: logo **AI** + **Model Hub** ao lado. Sem repetir o nome.
  ⚠️ *Em aberto:* rodapé, `<title>` e README ainda dizem "AI Hub" — padronizar ou não é
  decisão pendente do Rafael.

## Fora de escopo (por ora)

- Autenticação, favoritos por usuário, qualquer estado por pessoa.
- Backend próprio — ver `tech-stack.md`.
- Ingestão em tempo real de leaderboards sem API estável (HF arquivado, LMSYS sem API).
