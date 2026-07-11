---
name: head-of-operations
description: >
  Head of Operations e-commerce : piloter la logistique (entrepôt, préparation, expédition,
  retours), les transporteurs (Colissimo, Mondial Relay, relais vs domicile, SLA, litiges), le
  SAV (motifs, root cause, backlog), les stocks et l'approvisionnement (couverture, prévision,
  saisonnalité, invendus), les KPIs opérationnels (taux de service, coût par colis, taux d'erreur
  de préparation, délai clic-livraison, taux de retour et de non-retrait) et l'amélioration
  continue des process. À utiliser dès qu'un sujet OPÉRATIONNEL doit être analysé, chiffré ou
  amélioré : « nos délais de livraison dérivent », « le SAV explose », « trop d'erreurs de
  préparation », « faut-il changer de transporteur / de 3PL », « on est en rupture / en
  surstock », « optimise ce process », « dimensionne l'équipe pour le pic ». Déclencher même sans
  le mot « ops » ou « logistique » : « les clients se plaignent de ne pas recevoir leur colis »,
  « ça nous coûte cher d'expédier », « l'entrepôt n'arrive plus à suivre », « préparons Noël ».
  Donne les KPIs de référence, les grilles de diagnostic, les leviers par domaine et le format de
  plan d'action. Se combine avec `ecommerce-business-analyst` (coût-to-serve, chiffrage),
  `ecommerce-b2c-behavior` (réaction client) et `subscription-retention` (impact churn).
---

# Head of Operations — le process avant l'héroïsme

Une ops qui tient par les heures sup' et les coups de main est une ops qui casse au premier pic.
Le métier : des **process mesurés, des goulots identifiés, des coûts unitaires connus** — et un
plan d'action court. Ce skill outille le diagnostic et l'amélioration, domaine par domaine.

## 1. Les KPIs qui pilotent une ops e-commerce

| KPI | Définition | Ordre de grandeur sain |
|---|---|---|
| Taux de service | commandes expédiées dans le délai promis | > 95 % |
| Délai clic-livraison | commande → remise client, en jours ouvrés | 2-4 j (FR) |
| Coût logistique par colis | prépa + emballage + transport, sortant | à suivre en tendance |
| Taux d'erreur de préparation | mauvais article/taille/quantité | < 0,5 % |
| Taux de retour | colis retournés / expédiés | mode : 15-30 % ; suivre par motif |
| Taux de non-retrait (relais) | colis jamais retirés / envois relais | 2-8 % ; > 5 % = alerte |
| First response time SAV | 1er contact → 1re réponse | < 24 h |
| Couverture de stock | stock / ventes moyennes, en semaines | selon saisonnalité |

- Un KPI sans **définition écrite et sans responsable** n'existe pas. Chaque KPI : une définition,
  une fréquence, un seuil d'alerte, un propriétaire.
- Lire les KPIs en **tendance et en saisonnalité**, jamais en photo : un délai qui passe de 2,1 à
  2,6 j sur 6 semaines est plus grave qu'un pic isolé à 4 j.

## 2. Logistique sortante — entrepôt et préparation

- Cartographier le flux réel (réception → rangement → picking → packing → expédition) avec le
  **temps par étape** ; le goulot est presque toujours une seule étape — l'améliorer elle, pas
  tout le reste.
- Erreurs de préparation : traiter par **root cause** (référencement ambigu, tailles proches,
  picking de mémoire, pas de scan de contrôle) et non par rappel à l'ordre. Un scan de contrôle
  au packing élimine l'essentiel.
- Dimensionnement pic (Noël, soldes, rentrée) : capacité = colis/heure/préparateur × heures ;
  prévoir le pic à ×2-3 du nominal, décider TÔT entre intérim, extension d'horaires, ou lissage
  des promesses de délai. Le pic se prépare 2-3 mois avant.
- Externalisation (3PL) : pertinente quand le volume est volatil ou l'immobilier contraint ;
  comparer en coût complet par colis ET en perte de contrôle qualité (voir `cto` §1 pour la
  logique build vs buy — c'est la même).

## 3. Transport — piloter les transporteurs

- Suivre par transporteur : délai réel constaté (pas le contractuel), taux d'incident (perdu,
  endommagé, retard), coût par tranche de poids, qualité du dernier kilomètre par zone.
- **Relais vs domicile** : le relais coûte ~20-40 % de moins mais introduit le risque de
  non-retrait — le pire scénario économique (2 trajets payés, 0 € de CA, voir
  `ecommerce-business-analyst` §2-3). Arbitrer par segment client, pas globalement.
- Litiges transporteurs : réclamer systématiquement (perdus, endommagés) — c'est un process, pas
  un cas par cas ; le taux de recouvrement des litiges est un KPI en soi.
- Renégociation : préparer avec 12 mois de données réelles (volumes par tranche, zones, incidents) ;
  la menace crédible d'un second transporteur actif vaut mieux qu'un appel d'offres théorique.

## 4. Retours & non-retrait

- Instrumenter les **motifs de retour** (taille, qualité, ne correspond pas, changé d'avis) : un
  taux de retour élevé est d'abord une info produit (taillant, photos, description) avant d'être
  un coût logistique. Boucler vers le produit chaque mois.
- Process de retour : délai réception → contrôle → remise en stock à mesurer ; un retour qui
  traîne = stock immobilisé + remboursement retardé + contact SAV.
- Non-retrait : segmenter récidivistes vs occasionnels avant toute pénalité ; le levier principal
  est le rappel (notification J+3/J+6) avant la sanction (voir `ecommerce-b2c-behavior`).

## 5. SAV — le capteur de tout le reste

- Catégoriser 100 % des contacts par motif (où est mon colis, retour/remboursement, produit,
  taille, facturation). Le top 3 des motifs désigne les chantiers ops prioritaires : le SAV est
  le **thermomètre**, pas la maladie.
- « Où est mon colis » > 30 % des contacts = problème de tracking proactif, pas de SAV : notifier
  AVANT que le client demande (expédié, en cours, retard détecté).
- Mesurer : first response time, temps de résolution, taux de réouverture, contacts par commande
  (en tendance). Un backlog SAV qui gonfle se traite par la root cause des motifs, pas par des
  renforts seuls.

## 6. Stocks & approvisionnement

- Couverture cible **par catégorie/taille**, pas globale : la mode enfant tourne par saison et
  par taille — un stock global sain peut cacher des ruptures sur les tailles centrales et du
  surstock sur les extrêmes.
- Prévision : partir de N-1 ajusté de la croissance et du calendrier (rentrée, fêtes, soldes) ;
  toute prévision a une fourchette, et le plan d'appro doit dire ce qu'on fait dans le scénario
  bas (annulable ?) et haut (réassort possible en combien de semaines ?).
- Invendus : décider TÔT (démarque, ventes privées, outlet, don) — la valeur d'un invendu
  saisonnier fond chaque semaine ; un invendu stocké 1 an coûte souvent plus que sa valeur résiduelle.
- Inventaires tournants (cycle counts) plutôt qu'un inventaire annuel : la fiabilité de stock
  (> 98 %) conditionne tout le reste (promesse site, préparation, appro).

## 7. Améliorer un process — la méthode

1. **Aller voir** le process réel (gemba) — le process documenté et le process réel divergent toujours.
2. Mesurer : volume, temps par étape, taux d'erreur, coût unitaire. Sans mesure, pas d'amélioration, que des opinions.
3. Identifier LE goulot (il n'y en a qu'un à la fois) et les 5 pourquoi de sa cause.
4. Corriger par le **système** (checklist, scan, automatisation, suppression d'étape) plutôt que
   par la vigilance humaine — la vigilance s'érode, le système reste.
5. Standardiser puis re-mesurer ; une amélioration non mesurée après 1 mois n'a pas eu lieu.

## 8. Restituer un diagnostic ops

- **Constat chiffré** (KPI, tendance, coût de la non-qualité en €/an), puis causes racines, puis
  plan d'action en 2 horizons : quick wins < 1 mois et chantiers structurels.
- Chaque action : responsable, délai, indicateur de succès. Une action sans les trois est un vœu.
- Chiffrage économique fin → `ecommerce-business-analyst` ; impact client/churn →
  `ecommerce-b2c-behavior` / `subscription-retention` ; priorisation → `marketing-analytics`.
