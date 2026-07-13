# Sourcing & fraîcheur des données

## Hiérarchie de fiabilité (du plus fiable au plus biaisé)

| Rang | Source | Nature | Biais / limite |
|---|---|---|---|
| 1 | **Mercer TRS, WTW, Deloitte** | Enquêtes comp payantes, gros échantillons | Non accessibles en live (payant). Calibrées sur grandes entreprises structurées |
| 2 | **APEC** (apec.fr) | Data cadres France, publique, sérieuse | Peu de granularité dirigeant/PME |
| 3 | **Figures.hr** | Comp tech/startups (equity inclus) | Univers VC/scale-up, pas PME classique |
| 4 | **Proxinvest / rapports gouvernance** | Rému dirigeants sociétés cotées | Grandes entreprises seulement |
| 5 | **Guides cabinets** (Michael Page, Robert Walters, Hays, Robert Half, Expectra) | Grilles annuelles publiques | ⚠️ **Marketing, souvent gonflées** pour attirer candidats/clients. Garde-fou, pas vérité |
| 6 | **Glassdoor, Indeed, Payscale, LinkedIn Salary** | Déclaratif salariés | Auto-déclaré, non vérifié, biais de sélection |

## Règle d'usage
- **≥ 2 sources croisées**, jamais une seule.
- Toujours **afficher la date** de la donnée et **signaler le biais** (rangs 5-6).
- Pour un **dirigeant de PME/filiale** : ces sources ne suffisent pas → appliquer `methode-dirigeant.md` (P&L d'abord).

## Requêtes WebSearch types (à lancer à chaque évaluation)
- `étude rémunération <fonction> <secteur> France <année>`
- `salaire directeur <fonction> <taille entreprise> France <année> APEC`
- `guide des salaires <cabinet> <année> cadres direction`
- `rémunération dirigeant PME <secteur> France` / `ratio rémunération dirigeant chiffre d'affaires PME`
- Pour un poste précis dans un groupe connu : `<groupe> filiale <poste> rémunération` (rarement public → rester prudent).

## Protocole de refresh (cron)
- **Fréquence recommandée : trimestrielle** pour `benchmarks-france.md` (les guides cabinets sortent surtout en Q1 ; l'APEC publie en continu).
- À chaque refresh : relancer les requêtes types, mettre à jour la table datée, changer la mention « **Valable au JJ/MM/AAAA** ».
- Proposer à l'utilisateur un cron trimestriel (cohérent avec ses autres agents) — voir avec lui la fréquence exacte.
