# Soumissions
| Cible | Statut | État |
|---|---|---|
| x402scan | PRÊT (route /submitted découverte, payload dans tools/submit-all.sh §4) | PENDING-CREDS |

## x402scan.com - BLOCKED (2026-08-24)
- Preuve: 307 vers www., puis /submit /listing /add-tool /contact /api/submit tous 404 sur le vrai hôte
- POST /api/submit renvoie HTML Next.js (page 404), aucun endpoint JSON public
- robots.txt lisible (Content-Signal: ai-input=yes, sitemap présent)
- Verdict: pas de canal de soumission ouvert -> visibilité passive via IndexNow déjà active; re-test seulement si nouveau contenu majeur
