---
name: securite-auth
description: >
  Lentille sécurité authentification & gestion de session d'un audit applicatif (voir `securite-it`).
  Traque les failles de login/session/JWT (secrets faibles, algo `none`, expiration absente),
  stockage de mots de passe (hash faible/absent), reset password (token prévisible, énumération),
  MFA absent sur comptes sensibles, flows OAuth/OIDC mal implémentés (state/PKCE, redirect_uri),
  fixation/absence d'invalidation de session, brute-force non limité, timing attacks. À utiliser
  pour auditer tout ce qui touche à l'identité : « le login est-il sûr », « nos JWT sont-ils bien
  faits », « le reset password est-il exploitable », « faut-il du MFA », « OAuth correct ». Déclencher
  aussi via `securite-it`. Donne où chercher, la checklist par sévérité, comment confirmer, faux positifs.
---

# Sécurité Auth — l'identité est la porte d'entrée

Casser l'authentification, c'est court-circuiter tout le reste : les meilleurs contrôles d'accès
ne servent à rien si on peut se faire passer pour un autre. On vérifie comment un utilisateur
prouve qui il est (login, token, session) et à quel point ces preuves sont falsifiables.

## Où chercher

- Login : comparaison de mot de passe, verrouillage/rate-limit, messages d'erreur (énumération
  « email inconnu » vs « mot de passe invalide »).
- Hachage : algo de stockage des mots de passe (bcrypt/argon2 vs MD5/SHA nu vs clair).
- JWT : lib et config — algorithme (`HS256`/`RS256` vs `none`), source et robustesse du secret,
  `exp`/`nbf`, vérification de signature réellement effectuée, où le token est stocké.
- Sessions : génération d'ID (aléatoire fort ?), régénération après login (anti-fixation),
  invalidation au logout / changement de mot de passe, flags cookie (`HttpOnly`/`Secure`/`SameSite`).
- Reset password : génération du token (aléatoire, à usage unique, expirant ?), transport, fuite
  dans l'URL/logs.
- OAuth/OIDC : `state` (anti-CSRF), `PKCE`, validation stricte du `redirect_uri` (allowlist).
- MFA : présence sur admin/back-office ; possibilité de le contourner.

## Checklist par sévérité

**CRITIQUE**
- **JWT `alg: none`** accepté, ou signature non vérifiée, ou secret HS256 faible/deviné → forge
  de token → usurpation de n'importe quel compte.
- **Mots de passe en clair** en base, ou contournement total de l'auth.
- **Reset password à token prévisible/rejouable** → prise de contrôle de compte à distance.

**ÉLEVÉ**
- Hash faible (MD5/SHA1 sans sel) → cassage massif si la base fuite.
- Pas de régénération de session après login (fixation) ; session non invalidée au logout.
- `redirect_uri` OAuth non validé (allowlist absente) → vol de code/token.
- Absence de MFA sur le back-office/admin exposé sur Internet.

**MOYEN**
- Pas de rate-limit/lockout sur le login (brute-force, credential stuffing).
- Énumération de comptes (messages ou timing différenciés).
- Cookies de session sans `Secure`/`HttpOnly`/`SameSite` ; expiration de token trop longue.
- Politique de mot de passe absente (longueur mini, vérification contre listes compromises).

**FAIBLE** : verbosité, absence de notification de connexion suspecte.

## Confirmer

- JWT : vérifier que la vérification de signature est **réellement** appelée et que `alg` est
  contraint côté serveur (pas déduit du token). Un `jwt.verify` avec algo fixé = bon.
- Reset : le token doit être aléatoire (≥128 bits), à usage unique, expirant, et non renvoyé
  dans une réponse/URL loggée. Un UUIDv4 stocké haché côté serveur = bon.
- Rate-limit : distinguer absence réelle d'un rate-limit porté par une couche amont (WAF, gateway).

## Faux positifs classiques

- `RS256` avec clé publique de vérification exposée : c'est normal (asymétrique).
- Message d'erreur générique volontaire (« identifiants invalides ») : c'est la bonne pratique,
  pas une faille.
- MFA absent sur un compte utilisateur final à faible enjeu peut être MOYEN, pas ÉLEVÉ — calibrer
  selon la sensibilité.

Reporter au format `securite-it`. Le stockage des mots de passe recoupe `securite-bdd` ; les
cookies/CSRF recoupent `securite-front`.
