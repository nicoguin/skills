---
name: securite-it
description: >
  Orchestrateur d'audit de sécurité applicative défensif (OWASP-based) sur ses PROPRES repos de
  code. Pilote 9 lentilles spécialisées (front, back, BDD, auth, secrets, dépendances, infra,
  mémoire, RGPD), score les findings en sévérité type CVSS, vérifie de façon adversariale avant
  de crier, et produit un rapport priorisé + plan de remédiation. À utiliser dès qu'il faut
  auditer la sécurité d'un dépôt ou d'un service : « audit de sécu du repo X », « cherche les
  failles dans ce code », « on est safe côté sécurité ? », « pentest de notre appli », « revue
  de sécurité avant mise en prod », « lance les agents de sécurité », « scanne les vulnérabilités ».
  Déclencher même sans le mot « sécurité » : « est-ce qu'un attaquant pourrait… », « c'est risqué
  ce endpoint ? », « on a des clés en dur quelque part ? », « prépare l'audit périodique ». Donne
  la méthode d'audit, la taxonomie, le scoring, comment lancer les agents (fan-out ou workflow),
  et le format de rapport. Cadre STRICTEMENT défensif : audit de code qu'on a le droit d'auditer,
  jamais d'exploitation destructive ni d'exfiltration. Renvoie aux sous-skills `securite-front`,
  `securite-back`, `securite-bdd`, `securite-auth`, `securite-secrets`, `securite-dependances`,
  `securite-infra`, `securite-memoire`, `securite-rgpd`, et se combine avec `cto` et `data-engineer`.
---

# Sécurité IT — orchestrer un audit défensif qui ne crie pas au loup

Un audit de sécurité utile n'est pas une liste de tout ce qui *pourrait* mal tourner : c'est une
liste courte de ce qui est **réellement exploitable**, classée par gravité, avec la correction.
Un scanner qui remonte 400 findings dont 390 faux positifs est pire qu'inutile : il fait ignorer
les 10 vrais. Ce skill orchestre 9 lentilles spécialisées et impose une **vérification
adversariale** avant de retenir un finding.

## Cadre d'usage (non négociable)

- **Défensif uniquement** : auditer du code qu'on possède ou qu'on est mandaté pour auditer
  (les repos `little-cigogne`, ses propres services). Read-only.
- **Ne jamais exécuter d'exploit destructeur** (pas de DROP, pas de suppression, pas de DoS, pas
  de test sur la prod vivante), ne jamais exfiltrer de données réelles, ne jamais committer un
  secret trouvé dans le rapport en clair (le masquer : `AKIA****`).
- La sortie est un **rapport pour décideur/dev**, pas une preuve d'intrusion.

## Les 9 lentilles (une par agent)

| Dimension | Sous-skill | Ce qu'elle traque |
|---|---|---|
| Front / client | `securite-front` | XSS, CSP, CSRF, secrets dans le bundle, storage de tokens, CORS |
| Back / API | `securite-back` | Contrôle d'accès (IDOR), injection, SSRF, désérialisation, logique métier |
| Base de données | `securite-bdd` | Injection SQL, moindre privilège, chiffrement, exposition PII, RLS |
| Authentification | `securite-auth` | Sessions, JWT, MFA, reset password, OAuth, brute-force |
| Secrets / config | `securite-secrets` | Clés en dur, `.env` versionnés, secrets dans l'historique git |
| Dépendances | `securite-dependances` | CVE connues, lockfile, supply-chain, versions EOL |
| Infra / CI-CD | `securite-infra` | Buckets ouverts, IAM, secrets CI, conteneurs, ports exposés |
| Mémoire (natif) | `securite-memoire` | Buffer/integer overflow, use-after-free — **si code C/C++/Rust unsafe** |
| RGPD / données perso | `securite-rgpd` | PII loggée, rétention, minimisation, sous-traitants, droit à l'effacement |

## Sévérité — un langage commun (esprit CVSS)

Scorer chaque finding sur **impact × exploitabilité**, pas sur la peur.

- **CRITIQUE** : exploitable à distance sans authentification, impact majeur (RCE, dump de la
  base, contournement d'auth global, secret prod actif exposé publiquement). → corriger sous 24-48 h.
- **ÉLEVÉ** : exploitable par un utilisateur authentifié ou avec une condition réaliste ; fuite
  de données d'autres utilisateurs (IDOR), injection limitée, XSS stocké. → sprint courant.
- **MOYEN** : nécessite plusieurs conditions, impact limité, ou defense-in-depth manquante
  (CSP absente, cookie sans `Secure`, dépendance vulnérable non atteignable). → backlog priorisé.
- **FAIBLE** : hygiène/durcissement, pas de chemin d'exploitation réaliste identifié.

Un finding sans **chemin d'exploitation décrit** (qui, comment, avec quel accès) ne peut pas être
CRITIQUE ou ÉLEVÉ — au mieux MOYEN. C'est la règle qui tue les faux positifs.

## Méthode d'audit (4 temps)

1. **Recon** — cartographier la cible AVANT de chercher : langages, frameworks, points d'entrée
   (routes/API), surface d'authentification, présence de code natif, gestion des secrets. En
   déduire **quelles lentilles sont applicables** (inutile de lancer `securite-memoire` sur du
   TypeScript pur → le noter « non applicable » et passer).
2. **Audit par dimension** — une lentille = un agent = un sous-skill chargé. Chaque agent scanne
   sa surface, remonte des findings au format standard, cite `fichier:ligne` et l'extrait de preuve.
3. **Vérification adversariale** — pour chaque finding ÉLEVÉ/CRITIQUE, un second regard tente de
   le **réfuter** : le point est-il vraiment atteignable ? y a-t-il une sanitation en amont, un
   middleware d'auth, un WAF ? Défaut = réfuté si le chemin n'est pas démontré. On ne garde que
   ce qui survit.
4. **Synthèse** — dédupliquer, scorer, trier par sévérité, écrire le rapport + plan de remédiation.

## Lancer les agents (deux modes)

**Mode manuel (fan-out d'agents)** — pour un audit ponctuel piloté à la main : lancer en
parallèle un agent par lentille applicable, chacun avec la consigne « charge le sous-skill
`securite-<dim>` et audite <cible>, renvoie tes findings au format standard ». Puis un passage de
vérification, puis synthèse.

**Mode workflow (recommandé, autonome/répétable)** — utiliser le script fourni
`references/audit-workflow.js` via l'outil Workflow : il fait recon → fan-out → vérification
adversariale → synthèse de façon déterministe et produit un rapport JSON+Markdown. C'est ce mode
qu'on planifie (cron) pour un audit périodique par repo. Voir `references/orchestration.md` pour
le déclenchement, la planification, et la livraison du rapport (Slack/Drive).

## Format d'un finding (imposé)

```
[SÉVÉRITÉ] Titre court et précis
Dimension : <front|back|bdd|auth|secrets|deps|infra|memoire|rgpd>
Emplacement : chemin/fichier.ext:ligne
Description : quelle est la faille, en une phrase.
Chemin d'exploitation : qui peut l'exploiter, comment, avec quel niveau d'accès.
Preuve : extrait de code minimal (secrets masqués).
Remédiation : la correction concrète, idéalement avec le diff ou le pattern à appliquer.
Confiance : confirmé | plausible.
```

## Format du rapport final

```
# Audit sécurité — <cible> — <date>
## Synthèse : X critiques, Y élevés, Z moyens, W faibles — verdict go/no-go
## Findings (triés par sévérité, chacun au format ci-dessus)
## Non applicable : dimensions écartées et pourquoi
## Plan de remédiation : quick wins (<1j), sprint, chantiers de fond
```

Rester factuel : si aucune faille critique n'est trouvée, le dire clairement plutôt que gonfler
le rapport. Pour l'arbitrage build/priorisation des corrections, passer la main à `cto`.
