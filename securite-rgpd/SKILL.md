---
name: securite-rgpd
description: >
  Lentille sécurité des données personnelles / RGPD d'un audit applicatif (voir `securite-it`).
  Traque l'exposition et le sur-traitement de PII : données perso loggées (logs, analytics, erreurs),
  minimisation non respectée (collecte/rétention excessive), absence de durées de conservation et
  de purge, transferts vers des sous-traitants/tiers sans base légale claire, PII envoyée à des
  services externes (LLM, analytics, ESP) sans encadrement, données d'enfants (enjeu spécifique
  e-commerce enfant), et faisabilité technique des droits (accès, effacement, portabilité). À
  utiliser dès qu'on parle de données perso/conformité : « conformité RGPD », « on log des données
  perso ? », « durée de rétention », « on peut effacer un client ? », « quelles données partent
  chez ce prestataire ». Déclencher aussi via `securite-it`. Donne où chercher, la checklist par
  sévérité (mêlant risque data ET conformité), comment confirmer, et les faux positifs.
---

# Sécurité RGPD — la donnée qu'on ne collecte pas ne fuite pas

Le RGPD et la sécurité se rejoignent sur un principe : **minimiser**. Moins de PII collectée,
moins longtemps, dans moins d'endroits = moins de surface d'attaque ET plus de conformité. Cette
lentille regarde où vivent les données personnelles, où elles fuitent par négligence (logs,
tiers), et si l'entreprise peut techniquement tenir ses obligations.

## Où chercher

- **Logs & observabilité** : PII écrite dans les logs applicatifs, logs d'accès, traces d'erreur,
  outils de monitoring (Sentry) — emails, noms, adresses, tokens, numéros de commande liés à une
  personne. C'est la fuite la plus fréquente et la plus sous-estimée.
- **Envois vers des tiers** : payloads vers analytics (GA4), ESP/CRM (Customer.io, Klaviyo),
  services de paiement, **LLM/IA** — quelles PII partent, sous quel contrat (DPA) ?
- **Rétention** : existe-t-il des durées de conservation et une purge automatique ? Comptes
  inactifs, commandes anciennes, prospects, logs conservés indéfiniment.
- **Minimisation** : champs collectés vs réellement utilisés (date de naissance, genre, téléphone
  « au cas où »).
- **Droits des personnes** : le code permet-il d'**exporter** et surtout d'**effacer** toutes les
  données d'un client (y compris dérivées, backups, tiers) ?
- **Données sensibles / enfants** : e-commerce enfant → données concernant des mineurs, prudence
  renforcée ; jamais de catégorie sensible (santé) loggée.

## Checklist par sévérité

**CRITIQUE / ÉLEVÉ**
- PII en masse exposée (endpoint/export/log accessible) — recoupe `securite-back`/`securite-bdd`.
- Envoi de PII à un tiers **sans base légale ni DPA** (ex. données clients poussées vers un LLM
  public, ou vers un service hors UE sans encadrement).
- Impossibilité technique d'effacer un client sur demande (obligation légale non tenable).
- Données de mineurs traitées sans précaution ni base légale claire.

**MOYEN**
- PII loggée en clair dans les logs applicatifs/erreurs (fuite passive, rétention longue).
- Absence de durées de conservation / de purge automatique → accumulation.
- Sur-collecte de champs non utilisés.
- Analytics chargeant des identifiants directs sans anonymisation/consentement.

**FAIBLE** : registre des traitements incomplet, absence de pseudonymisation là où elle serait
simple, cookies non essentiels sans consentement granulaire.

## Confirmer

- Pour un log : vérifier qu'il contient bien de la **donnée identifiante réelle** (pas un ID
  technique opaque). Un `user_id=48213` seul est moins grave qu'un email + adresse.
- Pour un envoi tiers : identifier précisément les champs transmis et vérifier l'existence d'un
  cadre (DPA, finalité, consentement). Le risque « LLM » est concret : tracer ce qui part.
- Pour l'effacement : suivre si une suppression propage réellement (dérivés, caches, backups,
  exports tiers) ou laisse des résidus.

## Faux positifs classiques

- IDs techniques opaques, données déjà pseudonymisées/agrégées.
- Rétention justifiée par une obligation légale (comptabilité : factures 10 ans) — ce n'est pas
  de la sur-rétention, c'est une obligation ; le noter comme conforme.
- Consentement déjà géré par une CMP en place.

Reporter au format `securite-it`. Cette lentille est plus « conformité + risque » que purement
technique : formuler les findings de façon actionnable (quoi arrêter de logger/envoyer, quelle
durée de rétention poser). L'exposition technique des données recoupe `securite-bdd`/`securite-back`.
