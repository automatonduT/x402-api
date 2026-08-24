#!/usr/bin/env node
/* size-guard.js v1 - dimensionnement conservateur (curriculum semaine 3).
 * Entrees: bankroll, winRate [0-1], payoff (R), regime CALME|AGITE.
 * Regles: Kelly complet -> plafond QUART-Kelly; regime AGITE -> encore moitie;
 * edge<=0 ou entree invalide -> REFUSE taille 0. Verdict en francais.
 * Usage: node size-guard.js <bankroll> <winRate> <payoff> <regime>
 */
function compute(bankroll, winRate, payoff, regime) {
  const errs = [];
  if (!(bankroll > 0)) errs.push('bankroll doit etre > 0');
  if (!(winRate > 0 && winRate < 1)) errs.push('winRate doit etre dans (0,1)');
  if (!(payoff > 0)) errs.push('payoff doit etre > 0');
  const reg = String(regime || 'CALME').toUpperCase() === 'AGITE' ? 'AGITE' : 'CALME';
  if (errs.length) return { verdict: 'REFUSE', raisons: errs, taille: 0 };
  const edge = winRate - 1 / (1 + payoff);
  if (edge <= 0) {
    return { verdict: 'REFUSE', raisons: ['aucun avantage mathematique (edge=' + edge.toFixed(4) + '): ne pas trader cette strategie'], taille: 0 };
  }
  let kelly = (winRate * (payoff + 1) - 1) / payoff; // fraction optimale
  let frac = Math.min(kelly / 4, 0.25);              // plafond quart-Kelly ET 25% max
  if (reg === 'AGITE') frac /= 2;                    // vol-regime AGITE -> sizing divise par 2
  const taille = +(bankroll * frac).toFixed(2);
  return {
    verdict: 'DEPLOY', taille,
    detail: { edge: +edge.toFixed(4), kellyComplet: +kelly.toFixed(4), fractionAppliquee: +frac.toFixed(4), regime: reg },
    raisons: [
      'quart-Kelly plafonne a 25% du capital',
      reg === 'AGITE' ? 'regime AGITE detecte: exposition encore divisee par 2' : 'regime CALME: pas de decote volatilite'
    ]
  };
}
if (require.main === module) {
  const [b, w, p, r] = process.argv.slice(2);
  console.log(JSON.stringify(compute(+b || 1000, +w, +p, r)));
} else { module.exports = { compute }; }
/* auto-test: node size-guard.js --selftest */
if (process.argv[2] === '--selftest') {
  const t1 = compute(1000, 0.55, 2, 'CALME');   // edge positif calme
  const t2 = compute(1000, 0.55, 2, 'AGITE');   // meme edge, agite -> moitie de t1
  const t3 = compute(1000, 0.30, 1.5, 'CALME'); // edge negatif -> REFUSE
  const ok = t1.verdict === 'DEPLOY' && t2.taille === +(t1.taille / 2).toFixed(2) && t3.verdict === 'REFUSE' && t3.taille === 0;
  console.log((ok ? 'SELFTEST_OK' : 'SELFTEST_FAIL') + ' calme=' + t1.taille + ' agite=' + t2.taille + ' refuse=' + t3.taille);
}
