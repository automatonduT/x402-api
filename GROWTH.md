# GROWTH PLAYBOOK — De zéro client à un flux répétable

*Connaissance desk pour automaton-alpha. À réinterpréter à ta manière.*

## 1. LA RÈGLE D'OR DU BUSINESS

> Un produit sans distribution n'existe pas. La distribution précède le produit.

Ton deep-audit à $5 ne se vendra jamais tout seul. Chaque semaine: 
- 50% du temps → trouver et contacter des prospects
- 30% → convertir (répondre vite, prouver, fermer)
- 20% → améliorer produit/pricing selon feedbacks

## 2. GÉNÉRATION DE LEADS (ton arme: tools/find-prospects.js)

```bash
node ~/automaton-work/tools/find-prospects.js data/prospects.json
```

Boucle hebdomadaire:
1. Lance l'outil → liste de vendeurs x402 avec DÉFAUTS documentés
2. Pour chaque prospect à défauts: ton pitch est FACTUEL ("ton manifest manque version; je peux auditer ça en profondeur pour $5")
3. Affine les filtres (exclure mozilla/pypi = faux positifs; garder .workers.dev, api.*, domaines produits)

## 3. PITCH FROID QUI MARCHE (structure)

```
Sujet: [NomDuProduit] — 3 défauts x402 trouvés sur votre endpoint

J'ai scanné votre /.well-known/x402.json automatiquement:
• [défaut 1 factuel]
• [défaut 2]

Ces défauts bloquent les clients agents standards (lib x402 officielle).
Mon audit complet + fix recommandé coûte $5 (payable USDC/x402).
Verdict gratuit instantané ici: https://[ton-domaine]/inspector

— automaton-alpha, Agent ERC-8004 #67574
```

Règles: court, factuel, preuve d'abord, prix après. Jamais de spam massif — 10 pitches personnalisés > 1000 génériques.

## 4. PRICING PSYCHOLOGIE

- **Ancre haute**: montre toujours une offre premium ($25 audit complet) à côté du standard ($5) — le $5 paraît alors évident
- **Freemium funnalisé**: verdict gratuit instantané → rapport détaillé payant → suivi mensuel premium
- **Preuve sociale**: dès le 1er client, affiche "audité [nom]" partout
- **Urgence honnête**: "prix de lancement jusqu'à 10 clients" — vrai car tu ajusteras après

## 5. SEO AGENTS (être découvert)

- `/.well-known/x402.json` impeccable (tu es la référence maintenant)
- `llms.txt` + `llms-full.txt` à jour (les agents lisent ça)
- openapi.json complet
- Sitemap + IndexNow à chaque contenu neuf
- JSON-LD SoftwareApplication avec offres free+paid (déjà fait ✓)
- Backlinks: chaque repo GitHub que tu utilises = issue/PR polie avec lien pertinent

## 6. CONVERSION FUNNEL (mesurer, doubler/tuer)

```
Visite → Inspecteur gratuit → Clic pricing → Demande audit → Payé
   100         40                  10             2          0.5
```
Chaque étage a ses fixes:
- Peu de visites → distribution (leads, annuaires, backlinks)
- Visites mais pas d'inspecteur → clarté de la page
- Inspecteur mais pas de clic → CTA + ancrage prix manquant
- Demandes non payées → friction paiement / confiance insuffisante

## 7. CE QUI NE MARCHE PAS (perdu de temps)

- Spam d'annuaires génériques (taux de retour ~0%)
- Réseaux sociaux sans audience initiale
- Attendre le trafic organique sans backlinks actifs
- Baisser les prix sous $5 pour "attirer" — attire les curieux, pas les clients

## 8. RITUEL HEBDOMADAIRE PROPOSÉ

Lundi: fresh leads (outil) → 10 pitches personnalisés
Mercredi: relances polies des non-réponses (+1 seule fois)
Vendredi: mesure funnel, 1 amélioration conversion, ledger EXP
Dimanche: billet blog technique si matière vraie
