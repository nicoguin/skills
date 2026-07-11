---
name: securite-memoire
description: >
  Lentille sécurité mémoire / code natif d'un audit applicatif (voir `securite-it`). Traque les
  buffer overflows (stack/heap), integer overflow/underflow menant à des allocations erronées,
  use-after-free, double-free, lecture/écriture hors bornes, format strings non contrôlées, et
  usages `unsafe` en Rust. Pertinente UNIQUEMENT pour du code compilé/natif (C, C++, Objective-C,
  Rust `unsafe`, extensions natives Node/Python, WASM). À utiliser quand la cible contient du code
  bas niveau : « buffer overflow », « ce code C est-il sûr en mémoire », « audit d'une extension
  native », « use-after-free ». Déclencher aussi via `securite-it`. IMPORTANT : sur une stack web
  pure (JS/TS/PHP/Python géré, SQL), conclure « non applicable » et ne pas forcer de findings.
  Donne où chercher, la checklist par sévérité, comment confirmer, et l'applicabilité.
---

# Sécurité Mémoire — pertinente seulement s'il y a du natif

**À lire en premier — applicabilité.** Les vulnérabilités mémoire (buffer overflow &
consorts) existent dans les langages à gestion mémoire manuelle. Sur du JavaScript/TypeScript,
PHP, Python, Ruby, Go (hors `unsafe`/cgo), Java — le runtime gère les bornes et le garbage
collector : **ces classes de failles ne s'appliquent pas au code applicatif**. Si la cible est
une stack web classique (le cas de la plupart des repos e-commerce), écrire explicitement dans le
rapport « `securite-memoire` : non applicable — pas de code natif » et passer. Ne pas fabriquer
des findings pour justifier la lentille.

Elle **s'applique** si la cible contient : du C/C++/Objective-C, du Rust avec des blocs `unsafe`,
des **extensions natives** (addons Node en C++/N-API, modules Python en C/Cython, FFI), du WASM
compilé depuis du natif, ou du parsing bas niveau de formats binaires.

## Où chercher (si applicable)

- Copies mémoire non bornées : `strcpy`, `strcat`, `sprintf`, `gets`, `memcpy`/`memmove` avec une
  taille dérivée d'un input, boucles d'écriture sans borne.
- Tailles & arithmétique : calcul de taille d'allocation à partir d'input (`malloc(n * size)`
  → integer overflow → sous-allocation → dépassement), casts réduisant la largeur, `int` vs `size_t`.
- Cycle de vie : `free` puis réutilisation du pointeur (use-after-free), double `free`, retour de
  pointeur vers variable locale.
- Bornes : indexation de tableau avec index issu d'input non validé ; off-by-one.
- Format strings : `printf(user_input)` au lieu de `printf("%s", user_input)`.
- Rust : blocs `unsafe`, `transmute`, `get_unchecked`, FFI — la sûreté n'y est plus garantie.

## Checklist par sévérité

**CRITIQUE** : dépassement de tampon contrôlable par un input distant → écrasement mémoire →
potentielle exécution de code (RCE), surtout sur données réseau/fichier non fiables.

**ÉLEVÉ** : use-after-free / integer overflow menant à une écriture hors bornes exploitable ;
format string contrôlée par l'utilisateur.

**MOYEN** : lecture hors bornes (fuite mémoire d'info), dépassement nécessitant des conditions
locales peu réalistes.

**FAIBLE** : usage de fonctions dépréciées non atteignables par un input, `unsafe` justifié et
encadré mais non commenté.

## Confirmer

- Remonter jusqu'à l'**input** : la donnée qui atteint la copie/l'allocation est-elle contrôlée
  par un attaquant (réseau, fichier, argument), ou constante/interne ? Sans input contrôlé, ce
  n'est pas exploitable.
- Vérifier l'absence de garde (vérification de taille, `snprintf` avec limite, bounds check).
- Compilateur/atténuations : la présence d'ASLR/stack canaries/`-D_FORTIFY_SOURCE` réduit
  l'exploitabilité mais ne supprime pas le bug ; le noter, ne pas classer sans risque pour autant.

## Faux positifs classiques

- Toute la surface JS/TS/PHP/Python/Java « pure » → non applicable (ne pas remonter).
- `memcpy` avec tailles constantes maîtrisées.
- Bloc `unsafe` Rust correctement encapsulé avec invariants vérifiés.

Reporter au format `securite-it`, en indiquant l'atténuation compilateur si connue. En l'absence
de code natif, la seule sortie correcte est « non applicable ».
