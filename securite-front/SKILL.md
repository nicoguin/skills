---
name: securite-front
description: >
  Lentille sécurité front-end / client-side d'un audit applicatif (voir `securite-it`). Traque
  XSS (reflété, stocké, DOM-based), absence/faiblesse de CSP, CSRF, clickjacking, secrets exposés
  dans le bundle JS, stockage non sûr de tokens (localStorage), CORS permissif, open redirect,
  postMessage non validé, injection de dépendances front. À utiliser pour auditer du code
  navigateur (React, Vue, Next, RN Web, HTML/JS) : « failles côté front », « est-ce vulnérable au
  XSS », « ma CSP est-elle correcte », « un token traîne-t-il dans le localStorage », « audit du
  bundle ». Déclencher aussi via `securite-it`. Donne où chercher, la checklist par sévérité,
  comment confirmer l'exploitabilité, et les faux positifs classiques.
---

# Sécurité Front — la confiance s'arrête au navigateur

Tout ce qui vient du client est hostile par défaut ; et tout ce qui part dans le client est
public. Deux erreurs cardinales : (1) injecter des données non échappées dans le DOM, (2) croire
qu'un secret est protégé parce qu'il est « dans le code front ». Le bundle est téléchargeable et
désobfusquable par n'importe qui.

## Où chercher

- Rendu dynamique : `dangerouslySetInnerHTML`, `v-html`, `innerHTML`, `document.write`,
  `insertAdjacentHTML`, template strings insérées dans le DOM.
- Storage : `localStorage`/`sessionStorage.setItem` avec token/JWT/PII ; cookies posés côté JS.
- Réseau : config CORS (`Access-Control-Allow-Origin: *` + credentials), `fetch`/`axios` vers des
  URLs construites depuis l'input utilisateur (SSRF côté proxy, open redirect).
- Bundle : chaînes ressemblant à des clés (`sk_`, `AKIA`, `AIza`, `-----BEGIN`), endpoints admin,
  feature flags secrets. Chercher dans le build final, pas seulement les sources.
- En-têtes/meta : présence de `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`,
  `Referrer-Policy`.
- `window.postMessage` : handlers `message` qui ne valident pas `event.origin`.

## Checklist par sévérité

**CRITIQUE / ÉLEVÉ**
- **XSS stocké** : entrée utilisateur persistée puis rendue sans échappement (avis, pseudo,
  description) → exécution de JS chez d'autres utilisateurs. Vérifier tout le trajet donnée→rendu.
- **XSS DOM** : `location.hash`/`search` → `innerHTML`/`eval`/`setAttribute('href', …)`.
- **Secret d'API prod actif dans le bundle** : clé serveur (pas une clé publishable) exploitable.
- **CORS `*` avec `credentials: include`** : n'importe quel site lit les réponses authentifiées.

**MOYEN**
- CSP absente ou permissive (`unsafe-inline`, `unsafe-eval`, `*` en `script-src`).
- Token d'auth en `localStorage` (accessible à tout JS → amplifie tout XSS). Préférer cookie
  `HttpOnly`+`Secure`+`SameSite`.
- Pas de protection CSRF sur mutations basées cookie ; pas de `X-Frame-Options`/`frame-ancestors`
  (clickjacking).
- Open redirect : `?next=`/`?returnUrl=` utilisé sans allowlist.

**FAIBLE** : `Referrer-Policy` absente, sourcemaps de prod publiées, verbosité d'erreurs front.

## Règle de composition (un empilement de MOYEN peut faire un ÉLEVÉ)

La sévérité ne se lit pas finding par finding isolément : certains **se composent**. Cas typique et
important : **token de session lisible par JS** (cookie `httpOnly:false` ou localStorage) **+ absence
de CSP** **+ surface JS tierce first-party** (GTM, trackers same-origin). Pris séparément ce sont des
MOYEN ; ensemble, ils constituent une **capacité d'exfiltration de session active aujourd'hui** — un
tag tiers compromis/dérivé (ou une XSS) lit le token, sans autre condition → **ÉLEVÉ**. Ne pas
sous-titrer ce cas « conditionnel à une XSS » : le JS first-party (GTM) est déjà un vecteur d'exécution.
Ne pas monter en CRITIQUE tant qu'il faut un tag malveillant/une XSS (pas un attaquant distant anonyme)
et que l'API n'accepte pas les credentials cross-origin.

## Confirmer (ne pas juste flag)

- Pour un XSS : remonter la chaîne complète source → sink. S'il y a un échappement du framework
  (React échappe `{}` par défaut ; le risque est dans les `dangerouslySetInnerHTML`, les `href`
  `javascript:`, les libs de markdown mal configurées), le noter — sinon faux positif.
- Pour une clé dans le bundle : distinguer **clé publishable/publique** (Stripe `pk_`, clé Maps
  restreinte par referer — normal) d'une **clé serveur** (vraie faille). La restriction change tout.
- Pour CORS : vérifier si l'origine reflète l'input **et** si les credentials sont autorisés — les
  deux sont nécessaires pour que ce soit grave.

## Faux positifs classiques

- React/Vue échappent l'interpolation standard : un `{userInput}` en JSX n'est pas un XSS.
- Une clé `pk_`/publishable n'est pas un secret. Une CSP « permissive » sur un site sans contenu
  sensible est du durcissement, pas une faille exploitable.
- `localStorage` d'une préférence UI non sensible : ignorer.

Reporter au format de `securite-it`, avec le trajet donnée→sink comme chemin d'exploitation.
