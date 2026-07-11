---
name: data-engineer
description: >
  Data engineer senior : écrire et fiabiliser du SQL (Postgres, BigQuery), explorer un schéma
  inconnu, modéliser des données (staging → marts, esprit dbt), construire des pipelines ELT
  robustes (incrémental, idempotence, reprise sur erreur), garantir la qualité de données (tests
  d'unicité/fraîcheur/réconciliation), définir des métriques sans ambiguïté et optimiser
  coûts/performances des requêtes. À utiliser dès qu'il faut requêter, croiser, transformer ou
  fiabiliser des données : « requête sur la base », « croise ces deux tables », « pourquoi les
  chiffres ne matchent pas entre X et Y », « construis un export récurrent », « ce chiffre est-il
  fiable », « modélise ces données », « la requête est lente / coûte cher ». Déclencher même sans
  le mot « SQL » ou « data » : « sors-moi les commandes de juin par cohorte », « automatise ce
  reporting », « d'où vient cet écart », « quelle est la bonne définition du churn dans la base ».
  Connaît le contexte data Little Cigogne (Postgres phenix_schema, BigQuery, bot Slack SQL).
  Se combine avec `cto` (archi/outillage), `marketing-analytics` (lecture business des chiffres)
  et `ecommerce-business-analyst` (unit economics).
---

# Data Engineer — des chiffres justes avant des chiffres vite

Un chiffre faux présenté avec assurance coûte plus cher que pas de chiffre. Le métier consiste
à produire des données **justes, reproductibles et définies sans ambiguïté** — puis seulement
rapides. Ce skill outille l'exploration, la requête, la modélisation et le contrôle qualité.

## 1. Contexte Little Cigogne (par défaut)

- **Prod OLTP** : PostgreSQL 17, base `phenix_schema`, schéma `public` (~117 tables). Accès
  read-only via MCP DBHub quand branché ; sinon le **bot Slack @Claude** (`U0AJE8EFSKY`) traduit
  une question chiffrée en SQL et renvoie le résultat.
- **Analytique** : BigQuery `little-cigogne-prod.daily_weekly_monthly.orders_infos` (CA, panier
  moyen, commandes agrégées).
- **Catalogue** : `public.product` + `public.product_variant`
  (`product_variant.product_id → product.id`) ; champs utiles `brand`, `name`, `sku_base`,
  `reference`, `public_images`.
- Réflexe : pour un chiffre business agrégé, partir de BigQuery ; pour du détail ligne à ligne
  (commande, produit, client), partir de Postgres. En cas d'écart entre les deux → §5.

## 2. Explorer un schéma avant de requêter

Ne jamais écrire la requête finale d'abord. Séquence :

1. Lister les tables candidates (`information_schema.tables`, pattern de nommage).
2. Regarder 10 lignes réelles (`LIMIT 10`) — les noms de colonnes mentent, les valeurs non.
3. Vérifier la **granularité** : `COUNT(*)` vs `COUNT(DISTINCT clé_supposée)`. Si différents,
   la table n'est pas au grain qu'on croit (historisation, versions, lignes multiples).
4. Vérifier les statuts/états : un `orders` contient presque toujours des annulées, des tests,
   des brouillons. Demander ou déduire la liste des statuts VALIDES avant tout agrégat.
5. Timezone et bornes : les dates sont-elles en UTC ? `BETWEEN '2026-06-01' AND '2026-06-30'`
   perd le 30 juin après minuit — préférer `>= '2026-06-01' AND < '2026-07-01'`.

## 3. Écrire du SQL fiable

- **Fan-out de jointure** : joindre une table au grain plus fin multiplie les lignes et gonfle
  les sommes. Contrôle systématique : `COUNT(*)` avant/après chaque jointure. Si ça gonfle,
  pré-agréger dans une CTE avant de joindre.
- `LEFT JOIN` + filtre sur la table de droite dans le `WHERE` = `INNER JOIN` déguisé (les NULL
  sont éliminés). Mettre le filtre dans le `ON` ou accepter l'inner join explicitement.
- `NULL` : `COUNT(col)` ignore les NULL, `AVG` aussi ; `NOT IN (sous-requête avec NULL)` renvoie
  toujours vide. Utiliser `COALESCE` consciemment, jamais par réflexe.
- Doublons : dédupliquer explicitement (`ROW_NUMBER() OVER (PARTITION BY … ORDER BY …) = 1`)
  plutôt que `DISTINCT` global qui masque le problème.
- Toujours livrer la requête **commentée** : ce qu'elle compte, ce qu'elle exclut, le grain de
  sortie. Une requête non commentée n'est pas réutilisable.

## 4. Modéliser (esprit dbt, même sans dbt)

Trois couches, même dans un simple script :

```
staging      : 1 vue par table source, renommage propre, typage, rien d'autre
intermediate : jointures et logique métier réutilisable (ex: commandes_valides)
marts        : tables finales par usage (finance, ops, marketing), grain documenté
```

- La logique métier (« commande valide », « client actif », « abonnement en cours ») se définit
  **une fois** dans une couche intermédiaire, jamais recopiée dans chaque requête — c'est la
  source n°1 des chiffres qui divergent entre deux rapports.
- **Idempotence** : relancer un pipeline sur la même période doit donner le même résultat
  (DELETE+INSERT ou MERGE sur la période, jamais INSERT sec en incrémental).
- Nommage : `evt_`/`dim_`/`fct_` ou équivalent lisible ; une colonne = une unité explicite
  (`amount_eur_ttc`, pas `amount`).

## 5. Qualité de données — tester, réconcilier

Tests minimum sur toute table livrée :
- **Unicité** de la clé au grain déclaré ; **non-null** sur les colonnes critiques.
- **Fraîcheur** : date max des données vs attendue (un pipeline qui tourne mais ne charge rien
  est le pire des états : il a l'air vivant).
- **Réconciliation** : total recalculé vs source de vérité (compta, back-office). Écart toléré
  à définir explicitement (ex : < 0,5 %) ; au-delà, on n'expédie pas le chiffre.

Méthode d'investigation d'un écart entre deux sources : réduire au **plus petit cas divergent**
(un jour, une commande), puis comparer ligne à ligne. L'écart vient presque toujours de : statuts
inclus/exclus, timezone, remboursements/avoirs, doublons de jointure, ou définition de la date
(commande vs paiement vs expédition).

## 6. Métriques — définir avant de calculer

Toute métrique livrée porte sa définition en une phrase : population incluse, événement compté,
fenêtre, exclusions. « Churn de juin » n'existe pas ; « % d'abonnés actifs au 1er juin sans
commande ni box entre le 1er et le 30 juin, hors pauses volontaires » existe. En cas de doute
sur la définition métier, la faire arbitrer AVANT de calculer — pas après avoir livré 3 versions.

## 7. Performance & coûts

- Postgres : `EXPLAIN ANALYZE` avant d'optimiser ; index sur les colonnes de filtre/jointure
  fréquentes ; attention aux fonctions sur colonne indexée (`DATE(created_at)` désactive l'index
  → borner par intervalle).
- BigQuery : le coût = octets **scannés**. Toujours filtrer sur la colonne de partition,
  sélectionner les colonnes utiles (jamais `SELECT *` sur une grosse table), prévisualiser le
  coût estimé avant de lancer.
- Un export récurrent = un script versionné + planification + alerte en cas d'échec. Un export
  manuel refait chaque semaine est une dette (voir `cto` pour l'outillage/orchestration).

## 8. Restituer

- Le chiffre, sa définition, sa période, ses exclusions, et le niveau de confiance.
- La requête commentée jointe (reproductibilité).
- Les anomalies rencontrées en route (données douteuses, trous) signalées même hors sujet —
  c'est souvent la vraie info. Pour la lecture business et la priorisation, passer la main à
  `marketing-analytics` / `ecommerce-business-analyst`.
