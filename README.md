# Claude Skills

Skills Claude Code de Nicolas Guin. Chaque skill est un dossier contenant un `SKILL.md`
(frontmatter `name` + `description` = déclenchement, corps = méthode).

## Installation

Copier le dossier d'une skill dans `~/.claude/skills/` (Windows : `C:\Users\<user>\.claude\skills\`).

## Skills

| Skill | Rôle |
|---|---|
| [`cto`](cto/SKILL.md) | CTO virtuel : build vs buy, challenge d'équipe tech/presta, archi, dette technique, sécurité, coûts, IA |
| [`data-engineer`](data-engineer/SKILL.md) | Data engineer senior : SQL fiable (Postgres/BigQuery), modélisation, pipelines, qualité de données, métriques |
| [`head-of-operations`](head-of-operations/SKILL.md) | Head of Ops e-commerce : logistique, transporteurs, retours/non-retrait, SAV, stocks, amélioration continue |
| [`salaire-evaluation`](salaire-evaluation/SKILL.md) | Évaluation de rému (cadre → CEO) : périmètre, taille, secteur, filiale vs indépendant, méthode hybride marché/P&L, sourcing daté |

## Suite sécurité IT (audit défensif)

`securite-it` orchestre 9 lentilles spécialisées (1 agent = 1 lentille). Chaque audit fait
recon → fan-out par dimension → vérification adversariale → rapport priorisé. Workflow prêt à
l'emploi + guide d'automatisation (cron par repo) dans [`securite-it/references/`](securite-it/references/).

| Skill | Lentille |
|---|---|
| [`securite-it`](securite-it/SKILL.md) | Orchestrateur : méthode, scoring CVSS, lancement des agents, format de rapport |
| [`securite-front`](securite-front/SKILL.md) | XSS, CSP, CSRF, secrets bundle, storage token, CORS |
| [`securite-back`](securite-back/SKILL.md) | Contrôle d'accès/IDOR, injection, SSRF, désérialisation, logique métier |
| [`securite-bdd`](securite-bdd/SKILL.md) | Injection SQL, moindre privilège, chiffrement, PII, RLS |
| [`securite-auth`](securite-auth/SKILL.md) | Login, JWT, sessions, reset password, MFA, OAuth |
| [`securite-secrets`](securite-secrets/SKILL.md) | Clés en dur, `.env` versionné, secrets dans l'historique git |
| [`securite-dependances`](securite-dependances/SKILL.md) | CVE atteignables, lockfile, supply-chain, EOL |
| [`securite-infra`](securite-infra/SKILL.md) | Buckets ouverts, IAM, CI/CD, conteneurs, ports |
| [`securite-memoire`](securite-memoire/SKILL.md) | Buffer/integer overflow, use-after-free (code natif uniquement) |
| [`securite-rgpd`](securite-rgpd/SKILL.md) | PII loggée, rétention, envois tiers/LLM, droit à l'effacement |
