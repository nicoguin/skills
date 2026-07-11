---
name: securite-bdd
description: >
  Lentille sécurité base de données d'un audit applicatif (voir `securite-it`). Traque l'injection
  SQL (concaténation, `raw`, ORDER BY dynamique), le sur-privilège des comptes applicatifs,
  l'absence de chiffrement (au repos / en transit / colonnes sensibles), l'exposition de PII, les
  secrets dans les chaînes de connexion, l'absence de RLS/cloisonnement multi-tenant, les backups
  non chiffrés/non testés, et le sur-logging de données sensibles. À utiliser pour auditer la
  couche données (Postgres, MySQL, MongoDB, BigQuery) : « injection SQL possible », « le compte
  applicatif a-t-il trop de droits », « les données perso sont-elles chiffrées », « nos backups
  sont-ils sûrs ». Déclencher aussi via `securite-it`. Connaît le contexte Postgres phenix_schema.
  Donne où chercher, la checklist par sévérité, comment confirmer, et les faux positifs.
---

# Sécurité BDD — moindre privilège et pas de requête concaténée

Deux principes portent l'essentiel : les requêtes sont **paramétrées** (jamais de concaténation
d'input), et le compte que l'appli utilise a le **strict minimum** de droits. Une injection SQL
sur un compte read-only limité est gênante ; la même sur un compte `superuser` est un game over.

## Où chercher

- Construction de requêtes : `raw()`, `query(\`... ${x} ...\`)`, `.format()`/f-strings dans le
  SQL, `ORDER BY`/`LIMIT`/noms de colonnes dynamiques (souvent non paramétrables → allowlist obligatoire).
- Droits : rôle utilisé par l'appli (`phenix` vs `phenix_readonly`), `GRANT`, `SUPERUSER`,
  droits `DELETE`/`DROP`/`ALTER` inutiles pour un usage applicatif.
- Chiffrement : TLS forcé sur la connexion (`sslmode`), chiffrement au repos, colonnes sensibles
  (mot de passe → hash bcrypt/argon2 et non chiffrement réversible ; IBAN, données santé).
- Connexion : chaîne de connexion en dur / dans un fichier versionné (recouper avec `securite-secrets`).
- Multi-tenant : filtrage systématique par tenant/owner ; RLS Postgres si applicable.
- Backups : existence, chiffrement, **restauration testée**, accès au bucket de backup.
- Logs : requêtes loggées avec valeurs (PII), `log_statement=all` en prod.

## Checklist par sévérité

**CRITIQUE**
- **Injection SQL** exploitable sur un compte à droits larges → dump/altération de la base.
- **Compte applicatif `SUPERUSER`** ou avec `DROP`/`GRANT` → toute faille devient totale.
- Base/port exposé publiquement, ou backup accessible sans authentification.

**ÉLEVÉ**
- Injection SQL même sur compte limité (fuite de données).
- Mots de passe stockés en clair ou chiffrés de façon réversible (doivent être **hachés** avec
  sel : bcrypt/argon2/scrypt).
- Absence de cloisonnement multi-tenant → un tenant lit les données d'un autre (recoupe IDOR côté back).
- PII non chiffrée avec accès trop large.

**MOYEN**
- Connexion non TLS sur réseau non totalement privé.
- Sur-logging de PII/requêtes ; rétention des logs trop longue (recoupe `securite-rgpd`).
- Pas de séparation prod/preprod au niveau des comptes.

**FAIBLE** : index/vues exposant plus que nécessaire, absence de politique de rotation de mots
de passe de service.

## Confirmer

- Injection : vérifier que le driver **ne** paramètre **pas** (concaténation réelle). Un
  `$1, $2`/placeholders = sûr. Le risque résiduel typique est le tri/nom de colonne dynamique.
- Privilège : lire les `GRANT` réels, pas supposer. Sur phenix, distinguer `phenix_readonly`
  (prod, read-only — bien) de `phenix` (preprod).
- Hash de mot de passe : bcrypt (`$2b$`), argon2 (`$argon2`) = bon ; MD5/SHA1 nu = ÉLEVÉ ;
  AES réversible = ÉLEVÉ.

## Faux positifs classiques

- ORM avec requêtes paramétrées, même longues : pas d'injection.
- Chiffrement applicatif d'une colonne réellement non sensible : sur-ingénierie, pas une faille.
- `log_statement` verbeux en **preprod** sans PII réelle : moindre gravité.

Reporter au format `securite-it`. Pour la logique d'accès applicative (IDOR) voir `securite-back` ;
pour l'aspect données perso/rétention voir `securite-rgpd`.
