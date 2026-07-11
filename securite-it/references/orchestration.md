# Orchestration & automatisation des audits de sécurité

Comment passer d'un audit ponctuel à un dispositif autonome : **par repo** et **par période**.

## 1. Un audit ponctuel sur un repo (maintenant)

Deux façons, selon l'outillage disponible dans la session :

- **Workflow** (préféré) : lancer `audit-workflow.js` via l'outil Workflow, en passant la cible
  en `args` : `{ target: "C:\\chemin\\vers\\clone", repoName: "phenix" }`. Le script gère
  recon → fan-out par dimension → vérification adversariale → synthèse.
- **Fan-out manuel** : spawn d'un agent par lentille applicable (voir `SKILL.md` §Lancer les
  agents), puis vérification, puis synthèse à la main.

Toujours travailler sur un **clone read-only** à jour (`git clone --depth 1` ou `git pull`),
jamais contre la prod vivante.

## 2. Audit périodique (le dispositif cible)

L'intuition « à chaque repo, à chaque période » se réalise avec **un agent planifié (cron)** qui,
à chaque déclenchement :

1. met à jour le(s) clone(s) des repos cibles (`little-cigogne/phenix`, `back-office`, `cigogne-scraper`…) ;
2. lance le workflow d'audit sur chacun ;
3. compare au rapport précédent (diff : nouvelles failles, failles corrigées, régressions) ;
4. livre un rapport court là où on le lit (Slack `#securite` ou DM, ou fichier Drive
   `Securite/audit_<repo>_<date>.md`) ; n'alerte fort que sur les **nouveautés CRITIQUE/ÉLEVÉ**.

### Cadence recommandée

- **Hebdomadaire** (ex. lundi 7h) : audit léger de la branche par défaut de chaque repo actif.
- **À chaque release / avant mise en prod** : audit ciblé sur le diff (plus rapide, plus pertinent).
- **Mensuel** : audit complet + revue des dépendances (les CVE tombent en continu).

Un audit qui tourne mais que personne ne lit ne sert à rien : caler la livraison sur un canal
suivi, et garder le rapport **court et priorisé** (top findings d'abord, détail en pièce jointe).

### Mise en place du cron

Utiliser le skill `schedule` (ou l'outil de tâches planifiées) pour créer l'agent récurrent. Le
prompt planifié type : « Pour chaque repo de la liste [phenix, back-office, cigogne-scraper] :
git pull, charge le skill `securite-it`, lance le workflow d'audit, compare au dernier rapport,
et poste sur Slack #securite un résumé des nouveaux findings CRITIQUE/ÉLEVÉ avec le plan de
remédiation. Si rien de nouveau, poste une ligne "RAS". »

## 3. Bonnes pratiques d'automatisation

- **Diff-aware** : sur un repo déjà audité, prioriser le code *changé* depuis le dernier run —
  c'est là que les régressions apparaissent, et c'est beaucoup plus rapide.
- **Baseline & bruit** : stocker un rapport de référence ; ne ré-alerter que sur les deltas.
  Marquer les findings acceptés/faux positifs pour ne pas les re-remonter (fichier
  `.security-baseline.json` par repo).
- **Ne pas exécuter** le code audité ni les payloads : l'audit est statique + raisonnement, pas
  d'exploitation active. Toute vérification dynamique se fait en environnement de test isolé,
  jamais en prod.
- **Secrets** : si l'audit trouve un secret, le masquer dans le rapport et traiter la rotation
  comme action CRITIQUE hors-bande (ne pas laisser traîner le secret dans un canal Slack).
- **Budget agents** : 1 recon + N lentilles applicables (souvent 5-7 sur une stack web) +
  vérification des seuls ÉLEVÉ/CRITIQUE + 1 synthèse. Inutile de lancer les 9 systématiquement.
