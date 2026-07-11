---
name: securite-secrets
description: >
  Lentille sécurité secrets & configuration d'un audit applicatif (voir `securite-it`). Traque les
  identifiants en dur (clés API, mots de passe, tokens) dans le code, les fichiers `.env`/config
  versionnés, les secrets présents dans l'HISTORIQUE git (même supprimés depuis), les clés
  privées/certificats committés, les secrets dans les logs / messages d'erreur / CI, l'absence de
  gestion centralisée (vault) et de rotation. À utiliser dès qu'on cherche des secrets exposés :
  « a-t-on des clés en dur », « des secrets dans le repo », « le .env est-il versionné », « scanne
  l'historique git », « nos credentials fuient-ils ». Déclencher aussi via `securite-it`. Donne où
  chercher (patterns), la checklist par sévérité, comment confirmer et traiter, et les faux positifs.
---

# Sécurité Secrets — un secret dans git est un secret compromis

Dès qu'un secret entre dans l'historique git, il faut le considérer comme **brûlé** : le retirer
d'un commit ultérieur ne le supprime pas de l'historique, et il a pu être cloné/indexé. La
correction n'est jamais « supprimer la ligne » mais **rotation immédiate + purge d'historique**.

## Où chercher

- Patterns de clés dans tout le repo (et le build) : `AKIA`/`ASIA` (AWS), `AIza` (Google),
  `sk_live`/`sk_test`/`rk_` (Stripe secret), `xox[baprs]-` (Slack), `ghp_`/`github_pat_` (GitHub),
  `-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----`, `eyJ` (JWT/clé encodée), `mongodb+srv://`,
  `postgres://user:pass@`, `Bearer `, chaînes `password=`, `secret=`, `token=`.
- Fichiers sensibles versionnés : `.env`, `.env.*`, `config/*.yml` avec identifiants,
  `*.pem`/`*.key`/`*.p12`/`id_rsa`, fichiers de service-account JSON (GCP), `.npmrc`/`.pypirc`
  avec token.
- **Historique git** : `git log -p`, `git log --all --full-history`, recherche par pattern sur
  toutes les branches — les secrets supprimés « proprement » y restent.
- CI/CD : secrets en dur dans les workflows (`.github/workflows/*.yml`, `.gitlab-ci.yml`) plutôt
  qu'en variables protégées ; echo de variables sensibles dans les logs de build.
- `.gitignore` : vérifier qu'il couvre bien `.env`, clés, dumps — un `.env` déjà tracké reste
  tracké malgré `.gitignore`.

## Checklist par sévérité

**CRITIQUE**
- Secret **de production actif** exposé (clé de paiement live, credentials BDD prod, clé cloud
  avec droits larges, service-account GCP) → accès direct à des systèmes réels.
- Clé privée / certificat de signature committé.

**ÉLEVÉ**
- Secret prod dans l'**historique** git (même retiré du HEAD) tant que non tourné.
- Token CI/CD avec droits de déploiement ou d'accès registre en clair.

**MOYEN**
- Secrets de **test/preprod** ou de sandbox committés (à tourner, moindre impact).
- `.env` versionné sans secret critique mais révélant l'archi/les endpoints internes.
- Absence de gestion centralisée (secrets éparpillés en variables d'env non documentées).

**FAIBLE** : absence de politique de rotation, pas de scan de secrets en pre-commit hook.

## Confirmer & traiter

- **Vérifier que c'en est un vrai** : distinguer une clé publishable/publique (voir
  `securite-front`) d'un secret ; un exemple/placeholder (`sk_test_xxx`, `password=changeme`,
  `<YOUR_KEY>`) n'est pas un secret. Ne pas crier sur un `.env.example`.
- **Masquer** le secret dans le rapport (`sk_live_51H****`) — ne jamais recopier un secret réel
  dans un canal (Slack/ticket).
- Correction : (1) **révoquer/tourner** le secret côté fournisseur immédiatement, (2) purger
  l'historique (`git filter-repo`/BFG) si diffusé, (3) migrer vers un vault / variables d'env
  protégées, (4) ajouter un scan de secrets en CI (gitleaks/trufflehog) et un pre-commit hook.

## Faux positifs classiques

- `.env.example`, fixtures de test, placeholders, clés publiques/publishable, clés révoquées
  documentées comme telles.
- Hash (non réversible) confondu avec un secret.
- Chaîne haute-entropie qui est en fait un hash de build / checksum.

Reporter au format `securite-it`, avec le secret **masqué** et la rotation traitée hors-bande.
