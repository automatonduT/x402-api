// x402-buy.js - client x402 manuel (EIP-3009) pour automaton-alpha - CORRIGE amount
const { Wallet } = require('ethers');
const fs = require('fs');
const URL_ = process.argv[2];
if (!URL_) { console.error('usage: node x402-buy.js <url>'); process.exit(1); }
function loadKey() {
  const raw = JSON.parse(fs.readFileSync(process.env.HOME + '/.automaton/wallet.json', 'utf8'));
  const k = raw.privateKey || raw.private_key || raw.pk || raw.key;
  if (!k) throw new Error('no key field in wallet.json');
  return k;
}
async function main() {
  const wallet = new Wallet(loadKey());
  console.log('payer:', wallet.address);
  let r = await fetch(URL_, { headers:{accept:'application/json'}, signal: AbortSignal.timeout(20000) });
  if (r.status !== 402) { console.log('unexpected status', r.status); console.log((await r.text()).slice(0, 400)); return; }
  const body_full = await r.text(); let challenge = {};
  try { challenge = JSON.parse(body_full); } catch(e) {}
  const hdrC = r.headers.get('payment-required') || r.headers.get('x-payment-required') || r.headers.get('PAYMENT-REQUIRED');
  if (hdrC) {
    try { const hdrParsed = JSON.parse(Buffer.from(hdrC, 'base64').toString()); if (hdrParsed.accepts) challenge = hdrParsed; console.log('defi via en-tete'); } catch(e) {}
  }
  const acc = (challenge.accepts && challenge.accepts[0]) || null;
  if (!acc) { console.log('DEBUG challenge:', JSON.stringify(challenge).slice(0, 500)); return; }
  console.log('402 OK ->', acc.scheme, acc.network, 'amount(wei6):', acc.amount, 'payTo:', acc.payTo);
  const priceUsd = Number(acc.amount) / 1e6;
  if (priceUsd > 0.05) { console.log('ABORT: price', priceUsd, '> 0.05'); return; }
  const usdc = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const now = Math.floor(Date.now() / 1000);
  const authz = { from: wallet.address, to: acc.payTo, value: String(acc.amount), validAfter: String(now - 60), validBefore: String(now + Math.min(acc.maxTimeoutSeconds || 120, 600)), nonce: '0x' + Buffer.from(require('crypto').getRandomValues(new Uint8Array(32))).toString('hex') };
  const domain = { name: 'USD Coin', version: '2', chainId: 8453, verifyingContract: usdc };
  const types = { TransferWithAuthorization: [ { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' } ] };
  const signature = await wallet.signTypedData(domain, types, authz);
  console.log('signed EIP-3009');
  const paymentHeader = Buffer.from(JSON.stringify({ x402Version: 1, scheme: acc.scheme, network: acc.network, payload: { signature, authorization: authz } })).toString('base64');
  r = await fetch(URL_, { headers: { 'X-PAYMENT': paymentHeader }, signal: AbortSignal.timeout(25000) });
  const body = await r.text(); const receipt = r.headers.get('x-payment-response');
  console.log('FINAL STATUS:', r.status); console.log('BODY:', body.slice(0, 500)); if (receipt) console.log('RECEIPT:', Buffer.from(receipt, 'base64').toString().slice(0, 400));
  fs.appendFileSync(__dirname + '/experiments.md', `\n## PHASE C PURCHASE #1 - ${URL_}\n- quoi: ${(acc.description || 'market-pulse')} | prix: $${priceUsd.toFixed(4)} | vendeur: ${acc.payTo}\n- statut HTTP final: ${r.status} | receipt: ${receipt ? 'oui' : 'non'}\n`);
  console.log('ledger appended');
}
main().catch(e => { console.error('ERR', e.message, e.stack); process.exit(1); });
