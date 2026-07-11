export const meta = {
  name: 'audit-securite',
  description: 'Audit de sécurité défensif d\'un repo : recon → fan-out par lentille → vérification adversariale → rapport priorisé',
  whenToUse: 'Auditer la sécurité d\'un dépôt de code qu\'on a le droit d\'auditer. args: { target: chemin du clone, repoName: nom }',
  phases: [
    { title: 'Recon', detail: 'cartographier stack + lentilles applicables' },
    { title: 'Audit', detail: 'un agent par lentille de sécurité applicable' },
    { title: 'Verify', detail: 'réfutation adversariale des findings ÉLEVÉ/CRITIQUE' },
    { title: 'Synthese', detail: 'dédup, scoring, rapport + plan de remédiation' },
  ],
}

// ---- Cible ----
const target = (args && args.target) || '.'
const repoName = (args && args.repoName) || 'cible'

// ---- Les 9 lentilles (skill + surface) ----
const LENSES = [
  { key: 'front',   skill: 'securite-front',       focus: 'XSS, CSP, CSRF, secrets bundle, storage token, CORS' },
  { key: 'back',    skill: 'securite-back',        focus: 'contrôle d\'accès/IDOR, injection, SSRF, désérialisation, logique métier' },
  { key: 'bdd',     skill: 'securite-bdd',         focus: 'injection SQL, moindre privilège, chiffrement, PII, RLS' },
  { key: 'auth',    skill: 'securite-auth',        focus: 'login, JWT, sessions, reset password, MFA, OAuth' },
  { key: 'secrets', skill: 'securite-secrets',     focus: 'clés en dur, .env versionné, secrets dans l\'historique git' },
  { key: 'deps',    skill: 'securite-dependances', focus: 'CVE atteignables, lockfile, supply-chain, EOL' },
  { key: 'infra',   skill: 'securite-infra',       focus: 'buckets ouverts, IAM, CI/CD, conteneurs, ports' },
  { key: 'memoire', skill: 'securite-memoire',     focus: 'buffer/integer overflow, use-after-free — SI code natif seulement' },
  { key: 'rgpd',    skill: 'securite-rgpd',        focus: 'PII loggée, rétention, envois tiers/LLM, droit à l\'effacement' },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'applicable', 'findings'],
  properties: {
    dimension: { type: 'string' },
    applicable: { type: 'boolean' },
    notApplicableReason: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'title', 'location', 'description', 'exploitPath', 'remediation', 'confidence'],
        properties: {
          severity: { type: 'string', enum: ['CRITIQUE', 'ÉLEVÉ', 'MOYEN', 'FAIBLE'] },
          title: { type: 'string' },
          location: { type: 'string' },
          description: { type: 'string' },
          exploitPath: { type: 'string' },
          evidence: { type: 'string' },
          remediation: { type: 'string' },
          confidence: { type: 'string', enum: ['confirmé', 'plausible'] },
        },
      },
    },
  },
}

const RECON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['stack', 'applicableLenses'],
  properties: {
    stack: { type: 'string' },
    entryPoints: { type: 'string' },
    hasNativeCode: { type: 'boolean' },
    applicableLenses: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['stillValid', 'adjustedSeverity', 'reason'],
  properties: {
    stillValid: { type: 'boolean' },
    adjustedSeverity: { type: 'string', enum: ['CRITIQUE', 'ÉLEVÉ', 'MOYEN', 'FAIBLE', 'REJETÉ'] },
    reason: { type: 'string' },
  },
}

// ---- Phase 1 : Recon ----
phase('Recon')
const recon = await agent(
  `Tu fais la reconnaissance d'un audit de sécurité DÉFENSIF (read-only, pas d'exécution d'exploit) du dépôt "${repoName}" situé à ${target}. ` +
  `Cartographie : langages/frameworks, points d'entrée (routes/API), surface d'authentification, présence de code NATIF (C/C++/Rust unsafe/addons), gestion des secrets, infra/CI. ` +
  `Parmi ces lentilles, indique lesquelles sont applicables (clé) : ${LENSES.map(l => l.key).join(', ')}. ` +
  `Écarte 'memoire' s'il n'y a pas de code natif.`,
  { label: 'recon', schema: RECON_SCHEMA }
)

const applicable = LENSES.filter(l => (recon?.applicableLenses || LENSES.map(x => x.key)).includes(l.key))
log(`Stack: ${recon?.stack || '?'} — ${applicable.length}/${LENSES.length} lentilles applicables : ${applicable.map(l => l.key).join(', ')}`)

// ---- Phases 2+3 : Audit par lentille PUIS vérification adversariale des findings ÉLEVÉ/CRITIQUE ----
// pipeline : chaque lentille est vérifiée dès qu'elle a fini, sans attendre les autres.
const perLens = await pipeline(
  applicable,
  (lens) => agent(
    `Audit de sécurité DÉFENSIF (read-only, aucune exécution d'exploit/payload, aucune exfiltration). ` +
    `Charge et applique le skill "${lens.skill}". Cible : dépôt "${repoName}" à ${target}. Focus : ${lens.focus}. ` +
    `Remonte uniquement des findings avec un chemin d'exploitation décrit ; masque tout secret réel (ex. sk_live_****). ` +
    `Si la lentille n'est pas applicable (ex. mémoire sans code natif), renvoie applicable=false avec la raison, findings=[].`,
    { label: `audit:${lens.key}`, phase: 'Audit', schema: FINDINGS_SCHEMA }
  ),
  (result, lens) => {
    if (!result || !result.applicable || !result.findings?.length) return { lens: lens.key, findings: [] }
    const toVerify = result.findings.filter(f => f.severity === 'CRITIQUE' || f.severity === 'ÉLEVÉ')
    const kept = result.findings.filter(f => f.severity === 'MOYEN' || f.severity === 'FAIBLE')
    return parallel(
      toVerify.map(f => () =>
        agent(
          `Vérification ADVERSARIALE d'un finding de sécurité. Tente de le RÉFUTER : le chemin est-il réellement atteignable ? ` +
          `Y a-t-il une sanitation/un middleware d'auth/une allowlist en amont qui le neutralise ? Par défaut, REJETÉ si l'exploitabilité n'est pas démontrée. ` +
          `Finding : ${JSON.stringify(f)}. Contexte repo : ${target}.`,
          { label: `verify:${lens.key}:${f.title?.slice(0, 30)}`, phase: 'Verify', schema: VERDICT_SCHEMA }
        ).then(v => ({ ...f, severity: v?.adjustedSeverity || f.severity, verifyReason: v?.reason, verified: true }))
         .catch(() => f)
      )
    ).then(verified => ({
      lens: lens.key,
      findings: [...verified.filter(Boolean).filter(f => f.severity !== 'REJETÉ'), ...kept],
    }))
  }
)

// ---- Phase 4 : Synthèse ----
phase('Synthese')
const all = (perLens || []).filter(Boolean).flatMap(r => (r.findings || []).map(f => ({ ...f, dimension: r.lens })))
const order = { CRITIQUE: 0, 'ÉLEVÉ': 1, MOYEN: 2, FAIBLE: 3 }
all.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9))
const counts = all.reduce((acc, f) => (acc[f.severity] = (acc[f.severity] || 0) + 1, acc), {})
const notApplicable = LENSES.filter(l => !applicable.includes(l)).map(l => l.key)

const report = await agent(
  `Rédige le RAPPORT D'AUDIT SÉCURITÉ final en Markdown pour le dépôt "${repoName}". ` +
  `Suis le format du skill securite-it : titre+date, synthèse (compte par sévérité + verdict go/no-go), findings triés par sévérité (format imposé), ` +
  `section "Non applicable" (lentilles ${JSON.stringify(notApplicable)} + raisons), et un plan de remédiation en 3 horizons (quick wins <1j / sprint / chantiers de fond). ` +
  `Reste factuel : ne gonfle pas. Findings vérifiés (JSON) : ${JSON.stringify(all)}. Recon : ${JSON.stringify(recon)}.`,
  { label: 'synthese' }
)

log(`Audit "${repoName}" terminé — ${counts.CRITIQUE || 0} critiques, ${counts['ÉLEVÉ'] || 0} élevés, ${counts.MOYEN || 0} moyens, ${counts.FAIBLE || 0} faibles`)
return { repoName, counts, findings: all, report, recon, notApplicable }
