---
name: securite-dependances
description: >
  Lentille sécurité des dépendances / supply-chain d'un audit applicatif (voir `securite-it`).
  Traque les dépendances avec CVE connues, les versions en fin de vie (EOL), l'intégrité des
  lockfiles, les risques de supply-chain (typosquatting, dépendance abandonnée, install scripts
  malveillants), les dépendances directes vs transitives réellement atteignables, et les licences
  problématiques. À utiliser dès qu'on parle de librairies/paquets : « nos dépendances sont-elles
  à jour », « des CVE dans nos paquets », « npm audit dit quoi », « cette lib est-elle sûre »,
  « supply-chain ». Déclencher aussi via `securite-it`. Donne où chercher, comment prioriser
  l'atteignabilité (pas juste la sévérité brute), et les faux positifs.
---

# Sécurité Dépendances — la CVE atteignable, pas la CVE théorique

La plupart des `npm audit`/`pip-audit` remontent des dizaines de vulnérabilités dont l'écrasante
majorité **ne sont pas atteignables** dans le contexte (dépendance de dev, fonction jamais
appelée, vecteur non exposé). Le travail utile est de trier ce qui est **réellement exploitable
chez nous** et de le corriger, sans noyer l'équipe sous du bruit.

## Où chercher

- Manifestes & lockfiles : `package.json`+`package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`,
  `requirements.txt`/`poetry.lock`, `composer.json`+`composer.lock`, `go.mod`/`go.sum`, `Gemfile.lock`.
- Outils (à exécuter en lecture) : `npm audit --json`, `pnpm audit`, `pip-audit`, `osv-scanner`,
  `composer audit`, `govulncheck`. Croiser avec la base OSV/GitHub Advisories.
- Cohérence : lockfile présent et committé (sinon builds non reproductibles) ; versions épinglées.
- Signaux supply-chain : paquet récemment renommé/transféré, mainteneur unique inactif, nom
  proche d'un paquet populaire (typosquatting), `postinstall`/scripts d'install suspects.

## Prioriser par atteignabilité (le cœur du métier)

Pour chaque CVE remontée, poser 3 questions avant de fixer une sévérité :

1. **Runtime ou dev ?** Une vuln dans une dépendance de build/test non expédiée en prod est le
   plus souvent MOYEN/FAIBLE (sauf compromission de la chaîne de build).
2. **La fonction vulnérable est-elle appelée ?** Une CVE sur une API de la lib qu'on n'utilise pas
   n'est pas atteignable → baisser la sévérité, le noter.
3. **Le vecteur est-il exposé ?** (input utilisateur qui atteint le code vulnérable, réseau
   accessible). Sans vecteur, ce n'est pas un chemin d'exploitation.

Reprendre le score CVSS de l'avis, puis l'**ajuster au contexte** — ne pas recopier la sévérité
brute de l'outil.

## Checklist par sévérité

**CRITIQUE / ÉLEVÉ** : CVE RCE/injection/auth-bypass dans une dépendance **runtime atteignable**,
avec vecteur exposé ; dépendance clairement compromise (malware, crypto-miner dans un postinstall).

**MOYEN** : CVE réelle mais dev-only, ou runtime non atteignable ; version EOL sans CVE active
mais qui ne recevra plus de patch ; lockfile manquant (builds non reproductibles).

**FAIBLE** : vuln de faible impact (ReDoS sur input non exposé), licence à clarifier, dépendance
en retard de versions sans CVE.

## Confirmer

- Ne pas se fier au seul « X vulnerabilities found » : ouvrir chaque avis ÉLEVÉ+, lire le vecteur,
  vérifier l'usage réel dans le code.
- Vérifier qu'un fix existe (version patchée) et l'ampleur du bump (patch vs major) — un major
  breaking est un chantier, à signaler comme tel.

## Faux positifs classiques

- CVE dans une devDependency (bundler, test runner) présentée comme critique par l'outil.
- Vuln dans une fonction non importée.
- Alerte sur une version déjà surchargée/résolue via `overrides`/`resolutions`.

Reporter au format `securite-it` : indiquer pour chaque finding la version actuelle, la version
corrigée, et si le fix est un bump mineur ou un chantier de migration (arbitrage → `cto`).
