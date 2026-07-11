---
name: securite-back
description: >
  Lentille sécurité back-end / API d'un audit applicatif (voir `securite-it`). Traque le contrôle
  d'accès cassé (IDOR, élévation de privilège, endpoints admin non protégés), les injections
  (commande, template, NoSQL, LDAP), SSRF, désérialisation non sûre, mass assignment, absence de
  rate-limiting, upload de fichiers dangereux, exposition d'infos dans les erreurs, et failles de
  logique métier. À utiliser pour auditer du code serveur (Node, PHP, Python, Go, API REST/GraphQL) :
  « failles côté back / API », « ce endpoint est-il protégé », « IDOR possible », « SSRF », « la
  logique métier est-elle contournable ». Déclencher aussi via `securite-it`. Donne où chercher,
  la checklist par sévérité, comment confirmer, et les faux positifs.
---

# Sécurité Back — le contrôle d'accès avant l'injection

Le n°1 des failles web (OWASP A01) n'est pas l'injection, c'est le **contrôle d'accès cassé** :
une route qui fait confiance à un ID passé par le client, un check `isAdmin` oublié, une ressource
d'un autre utilisateur accessible en changeant un numéro. On cherche d'abord *qui a le droit de
faire quoi*, ensuite *ce qui est injectable*.

## Où chercher

- Routes/contrôleurs : chaque endpoint mutant (POST/PUT/DELETE) et chaque lecture de ressource
  identifiée par un ID. Qui vérifie l'appartenance/le rôle ? Où ?
- Requêtes construites : concaténation de strings dans SQL/commandes shell/templates ; `eval`,
  `exec`, `child_process`, `os.system`, `Runtime.exec`.
- Appels sortants : `fetch`/`curl`/`request` vers une URL dérivée de l'input (SSRF, surtout vers
  métadonnées cloud `169.254.169.254`).
- Désérialisation : `pickle`, `unserialize` (PHP), `readObject` (Java), YAML `load` non sûr.
- Binding d'objets : création/màj d'entité à partir du body entier (`Model(**body)`,
  `Object.assign(user, req.body)`) → mass assignment (`isAdmin`, `role`).
- Uploads : type/extension/chemin de destination, exécution possible du fichier uploadé.
- Gestion d'erreurs : stack traces, requêtes SQL, chemins serveur renvoyés au client.

## Checklist par sévérité

**CRITIQUE**
- **Auth manquante** sur endpoint sensible (admin, export, suppression) accessible sans session.
- **Injection de commande** / **désérialisation non sûre** d'input → RCE.
- **SSRF** atteignant le réseau interne ou les métadonnées cloud (vol de credentials IAM).

**ÉLEVÉ**
- **IDOR** : `GET /orders/:id` ou `/users/:id` sans vérifier que la ressource appartient à
  l'appelant → lecture/modif des données d'autrui.
- **Élévation de privilège** : rôle contrôlé côté client, ou mass assignment de `role`/`isAdmin`.
- **Injection SQL** paramétrable (voir aussi `securite-bdd` pour la couche données).
- Upload menant à exécution (webshell) ou path traversal (`../`).

**MOYEN**
- Pas de rate-limiting sur login / reset / endpoints coûteux (brute-force, énumération, DoS).
- Fuite d'info dans les erreurs ; verbes HTTP non restreints ; GraphQL introspection + pas de
  limite de profondeur/complexité.
- Validation d'input absente (types, bornes) même sans exploitation directe démontrée.

**FAIBLE** : en-têtes de sécurité manquants côté API, logs trop verbeux.

## Confirmer

- IDOR : montrer qu'aucun `WHERE owner_id = current_user` / check d'appartenance n'existe entre
  la route et la donnée renvoyée. S'il y a un middleware d'autorisation en amont, ce n'en est pas un.
- Injection : distinguer requête **paramétrée** (ORM/prepared statement — sûr) de la
  concaténation. Un ORM utilisé normalement n'est pas injectable ; c'est le `raw()` concaténé qui l'est.
- SSRF : vérifier qu'il n'y a pas d'allowlist d'hôtes ni de résolution DNS filtrée.

## Faux positifs classiques

- Endpoint « sans auth » mais protégé par un middleware global/route-guard en amont : lire la
  chaîne de middlewares avant de conclure.
- `exec` avec des arguments 100 % constants (pas d'input) : pas une injection.
- ORM paramétré : pas une injection SQL, même si la requête est complexe.

Reporter au format `securite-it` ; toujours décrire qui exploite et avec quel niveau d'accès.
