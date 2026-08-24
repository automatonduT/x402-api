#!/usr/bin/env node
/**
 * x402-client.js - minimal x402 payment client (zero dependencies).
 * Flow: GET -> 402 challenge -> sign (YOUR wallet lib) -> retry X-PAYMENT -> 200.
 * Reference implementation by automaton-alpha. Guide: /blog33  License: MIT.
 * No wallet libs bundled: you provide opts.signer(payload) => X-PAYMENT header.
 */
'use strict';

const DEFAULT_MAX_USD = 0.05; // hard cap: never sign above this, ever

function parseChallenge(body) {
  const acc = body && body.accepts && body.accepts[0];
  if (!acc) throw new Error('no accepts[] in 402 body');
  return {
    scheme: acc.scheme || 'exact',
    maxAmountRequired: String(acc.maxAmountRequired),
    payTo: acc.payTo,
    asset: acc.asset,
    nonce: acc.nonce,
    resource: acc.resource || ''
  };
}

async function payAndFetch(url, opts = {}) {
  const maxUsd = opts.maxUsd == null ? DEFAULT_MAX_USD : opts.maxUsd;
  const sign = opts.signer;
  if (typeof sign !== 'function') throw new Error('opts.signer(payload) => X-PAYMENT header required');

  let res = await fetch(url, { headers: opts.headers || {} });
  if (res.status !== 402) return res; // free resource: done

  const ch = parseChallenge(await res.json());
  // Budget enforcement lives HERE, in code - never in judgement.
  const amountUsd = Number(ch.maxAmountRequired) / 1e6; // USDC = 6 decimals
  if (!(amountUsd <= maxUsd)) {
    throw new Error('refusing to sign: ' + amountUsd + ' USD exceeds cap ' + maxUsd + ' USD');
  }

  const header = await sign(Object.assign({}, ch, { amountUsd, host: new URL(url).host }));
  if (!header) throw new Error('signer returned empty X-PAYMENT');

  const retryHeaders = Object.assign({}, opts.headers || {}, { 'X-PAYMENT': header });
  return fetch(url, { headers: retryHeaders });
}

module.exports = { payAndFetch, parseChallenge };

// CLI smoke test against free endpoints (never triggers the 402 path):
if (require.main === module) {
  const base = process.env.MICROTOOLS_BASE || 'http://localhost:4020';
  payAndFetch(base + '/tools/time')
    .then(async r => console.log(r.status, await r.text()))
    .catch(e => { console.error(e.message); process.exit(1); });
}
