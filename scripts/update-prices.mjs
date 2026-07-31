#!/usr/bin/env node
/**
 * update-prices.mjs — Ingestão de preços/contexto via OpenRouter API.
 *
 * Fonte: https://openrouter.ai/api/v1/models  (pública, sem API key).
 * Atualiza SOMENTE os campos operacionais que a OpenRouter fornece de forma
 * confiável — price.input, price.output e context — e registra a proveniência
 * em priceSource/priceVerified. NÃO toca em scores/governança (curadoria do
 * chapter permanece intacta). É o princípio "híbrido honesto": preço automatizado,
 * qualidade curada, cada um com sua própria data de verificação.
 *
 * Uso:
 *   node scripts/update-prices.mjs            # atualiza e escreve o JSON
 *   node scripts/update-prices.mjs --dry-run  # só mostra o que mudaria
 */

import { readFile, writeFile } from 'node:fs/promises';

const DATA_PATH = new URL('../models-data.json', import.meta.url);
const ENDPOINT = 'https://openrouter.ai/api/v1/models';
const DRY_RUN = process.argv.includes('--dry-run');
const TODAY = new Date().toISOString().slice(0, 10);

// Preço por 1M tokens, arredondado (OpenRouter fornece USD por token, como string).
const per1M = (v) => {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1e6 * 10000) / 10000;
};

async function main() {
  const raw = await readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  console.log(`→ Buscando modelos em ${ENDPOINT} …`);
  const res = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`OpenRouter respondeu ${res.status} ${res.statusText}`);
  const payload = await res.json();
  const remote = new Map((payload.data || []).map((m) => [m.id, m]));
  console.log(`  ${remote.size} modelos disponíveis na OpenRouter.\n`);

  let updated = 0, changed = 0;
  const skipped = [];

  for (const m of data.models) {
    if (!m.openrouterId) { skipped.push(`${m.id} — sem openrouterId`); continue; }
    const or = remote.get(m.openrouterId);
    if (!or) { skipped.push(`${m.id} — '${m.openrouterId}' não encontrado na OpenRouter`); continue; }

    const nextIn = per1M(or.pricing?.prompt);
    const nextOut = per1M(or.pricing?.completion);
    const nextCtx = Number(or.context_length) || m.context;

    const diffs = [];
    if (nextIn !== null && nextIn !== m.price.input) diffs.push(`in $${m.price.input}→$${nextIn}`);
    if (nextOut !== null && nextOut !== m.price.output) diffs.push(`out $${m.price.output}→$${nextOut}`);
    if (nextCtx !== m.context) diffs.push(`ctx ${m.context}→${nextCtx}`);

    if (diffs.length) { changed++; console.log(`~ ${m.name}: ${diffs.join(', ')}`); }

    if (nextIn !== null) m.price.input = nextIn;
    if (nextOut !== null) m.price.output = nextOut;
    m.context = nextCtx;
    m.priceSource = 'OpenRouter API';
    m.priceVerified = TODAY;
    updated++;
  }

  data.meta.generatedAt = TODAY;
  if (data.meta.sources) data.meta.sources.pricing = `OpenRouter API (auto, ${TODAY})`;

  console.log(`\n✔ ${updated} modelos com preço atualizado · ${changed} com mudança de valor.`);
  if (skipped.length) {
    console.log(`\n⚠ ${skipped.length} pulados (mantêm valor curado):`);
    skipped.forEach((s) => console.log(`   - ${s}`));
  }

  if (DRY_RUN) {
    console.log('\n(dry-run) Nada foi escrito.');
    return;
  }
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`\n💾 models-data.json atualizado.`);
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
