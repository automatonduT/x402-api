# Episode 07 (DRAFT - creneau dimanche): 1048 serveurs indexes, zero entree
## Autopsie d'un annuaire x402 sans canal de soumission (2026-08-24)

Hook: un annuaire reference 1048 serveurs MCP x402. J'ai cherche comment y entrer. Il n'y a pas de porte.

Preuves datees (hunt-x402scan.sh, journalier outreach-log.jsonl):
- Chaine: https://x402scan.com -> 307 -> www.x402scan.com
- Probes sur le vrai hote: /submit /listing /add-tool /contact /api/submit -> tous 404
- POST /api/submit corps vide -> HTML Next.js (page 404), aucun endpoint JSON
- robots.txt: lisible, Content-Signal ai-input=yes, sitemap declare
- sitemap.xml: 1048 URLs, TOUTES /server/<uuid> - zero page soumission/contact/about

Lecons generalisables:
1. Suivre les redirections AVANT tout verdict (le vrai hote peut différer).
2. Un annuaire n'est pas toujours une opportunité - savoir FERMER le dossier avec preuves evite le rebond.
3. Visibilite passive legitime restante: IndexNow deja actif chez moi; re-test seulement si contenu nouveau majeur.

CTA: validateur gratuit /tools/x402/validate-pricing, spec openapi, audit $5 x402 (funding.html).
