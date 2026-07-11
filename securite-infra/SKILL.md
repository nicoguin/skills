---
name: securite-infra
description: >
  Lentille sécurité infrastructure / cloud / CI-CD d'un audit applicatif (voir `securite-it`).
  Traque les buckets/stockages ouverts, les permissions IAM trop larges, les ports/services
  exposés, les secrets et permissions excessives dans les pipelines CI/CD, les images/conteneurs
  non durcis (root, image obsolète, secrets en build args), l'IaC mal configurée (Terraform,
  Dockerfile, k8s), l'absence de HTTPS/headers de sécurité côté edge, et les webhooks non
  authentifiés. À utiliser dès qu'on audite le déploiement/l'hébergement : « notre bucket est-il
  public », « les droits cloud sont-ils trop larges », « la CI est-elle sûre », « le Dockerfile
  est-il durci », « ce webhook est-il authentifié ». Déclencher aussi via `securite-it`. Donne où
  chercher, la checklist par sévérité, comment confirmer, et les faux positifs.
---

# Sécurité Infra — la faille n'est souvent pas dans le code

Beaucoup de compromissions viennent non du code mais de son **environnement** : un bucket public,
un rôle IAM en `*:*`, un secret dans la CI, un conteneur qui tourne en root avec une image de 2019.
On audite la façon dont le code est construit, déployé et exposé.

## Où chercher

- IaC & déploiement : `Dockerfile`, `docker-compose.yml`, manifests k8s, `*.tf` (Terraform),
  `cloudbuild.yaml`, `app.yaml`, config Cloud Run / Vercel / Netlify.
- CI/CD : `.github/workflows/*.yml`, `.gitlab-ci.yml` — secrets, permissions du token
  (`permissions:`), actions tierces épinglées ou non (`uses: x@main` vs `@sha`), exécution de
  code non fiable (PR de forks avec accès secrets).
- Stockage : politiques de buckets (S3/GCS) — accès public, ACL, chiffrement.
- IAM : rôles/policies — wildcards (`Action: "*"`, `Resource: "*"`), comptes de service partagés.
- Réseau : ports exposés, groupes de sécurité `0.0.0.0/0` sur des ports non-web, bases accessibles
  publiquement, absence de HTTPS/redirection.
- Edge : en-têtes de sécurité (HSTS, CSP côté serveur), TLS version, webhooks entrants (signature
  vérifiée ?).

## Checklist par sévérité

**CRITIQUE**
- **Bucket/stockage public** contenant des données réelles/PII/backups.
- **IAM `*:*`** ou clé cloud à droits admin utilisée par l'appli/la CI.
- Base de données ou panneau d'admin exposé publiquement sur Internet.
- Secret prod dans la CI accessible aux PR de forks (exfiltration via workflow).

**ÉLEVÉ**
- Conteneur en **root**, image de base obsolète/EOL, secrets passés en `build args` (persistés
  dans les layers).
- Actions CI tierces non épinglées (`@main`) → supply-chain sur le pipeline.
- Webhook entrant sans vérification de signature → déclenchement/injection par un tiers.
- Token CI avec permissions `write` par défaut inutiles.

**MOYEN**
- Pas de HSTS / redirection HTTP→HTTPS ; TLS ancien toléré.
- Groupe de sécurité trop ouvert sur un port non exposé au public.
- Logs d'infra non centralisés / non surveillés.

**FAIBLE** : durcissement manquant (read-only rootfs, user non-root explicite), tags d'image
`latest`.

## Confirmer

- Bucket « public » : vérifier s'il sert volontairement des assets publics (images produit — OK)
  vs s'il contient des données sensibles (grave). Le contenu décide.
- IAM large : lire la policy réelle ; un rôle scopé à un bucket précis n'est pas un `*:*`.
- CI : distinguer un secret exposé aux forks (grave) d'un secret réservé aux pushes internes.

## Faux positifs classiques

- Bucket public d'assets statiques destinés à l'être (CDN d'images).
- Clé publishable côté build.
- `latest` sur un environnement de dev non exposé.

Reporter au format `securite-it`. Les secrets CI recoupent `securite-secrets` ; l'arbitrage
d'outillage/coût recoupe `cto`.
