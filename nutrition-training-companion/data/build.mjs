#!/usr/bin/env node
// Builds the downloadable data files from the two canonical JSON files.
//
//   node data/build.mjs
//
//   evidence/library.json   ->  evidence/claims.csv, evidence/sources.csv,
//                               evidence/sources.ris (Zotero, EndNote, Mendeley),
//                               evidence/sources.bib (BibTeX),
//                               evidence/evidence-library.md
//   catalogue/catalogue.json -> catalogue/datasets.csv, catalogue/what-to-download.md
//
// The prototype's build (prototype/build.mjs) reads the same JSON files and the
// files written here, so the app, the page's downloads and this folder agree.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const readJson = (p) => JSON.parse(readFileSync(join(here, p), 'utf8'));
const write = (p, text) => writeFileSync(join(here, p), text);

const CHECKS = ['identifier_resolves', 'metadata_matches', 'study_design_strong', 'peer_reviewed_indexed', 'not_retracted', 'finding_supported'];
const CHECK_WORDS = {
  identifier_resolves: 'Identifier resolves to this paper',
  metadata_matches: 'Title, authors, journal and year match',
  study_design_strong: 'Strong study design',
  peer_reviewed_indexed: 'Peer-reviewed and indexed',
  not_retracted: 'No retraction or expression of concern found',
  finding_supported: 'The abstract supports the stated finding'
};
const STATUS_WORDS = { active: 'Enough verified evidence', draft: 'Not enough evidence yet' };

/* ---------------------------------------------------------------- helpers */
export const isVerified = (src) => CHECKS.every((c) => src.checks && src.checks[c] === 'pass');
export const sourceLink = (src) => (src.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${src.pmid}/` : src.doi ? `https://doi.org/${src.doi}` : src.url || '');

function csvCell(v) {
  if (v == null) return '';
  const s = Array.isArray(v) ? v.join('; ') : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function toCsv(rows, columns) {
  /* A byte-order mark makes Excel read the file as UTF-8. */
  return '\ufeff' + [columns.map((c) => c.label).join(','), ...rows.map((r) => columns.map((c) => csvCell(c.get(r))).join(','))].join('\r\n') + '\r\n';
}

/* "Craven J, McCartney D" -> ["Craven, J", "McCartney, D"]; keeps "et al." out. */
function authorList(authors) {
  return String(authors || '')
    .replace(/\bet al\.?/i, '')
    .split(/,\s*|;\s*|\band\b/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => {
      const m = a.match(/^(.*\S)\s+([A-Z]{1,4})$/);
      return m ? `${m[1]}, ${m[2]}` : a;
    });
}
/* Volume, issue and pages from strings like "J Sports Sci. 2017;35(11):1073-1082" or "24(4):1150–1159". */
function bibParts(citation) {
  const c = String(citation || '');
  const full = c.match(/(\d+)\s*\(([^)]+)\)\s*:\s*([A-Za-z]?\d+)(?:\s*[–-]\s*([A-Za-z]?\d+))?/);
  if (full) return { volume: full[1], issue: full[2], start: full[3], end: full[4] || null };
  const short = c.match(/(\d+)\s*:\s*([A-Za-z]?\d+)(?:\s*[–-]\s*([A-Za-z]?\d+))?/);
  if (short) return { volume: short[1], issue: null, start: short[2], end: short[3] || null };
  return { volume: null, issue: null, start: null, end: null };
}

/* ---------------------------------------------------------------- evidence */
const lib = readJson('evidence/library.json');
const byId = new Map(lib.sources.map((s) => [s.id, s]));
const rolesFor = (src) => lib.claims.flatMap((c) => [
  ...(c.sources || []).filter((id) => id === src.id).map(() => `${c.key}: supports`),
  ...(c.contradicting || []).filter((id) => id === src.id).map(() => `${c.key}: contradicts`),
  ...(c.context || []).filter((id) => id === src.id).map(() => `${c.key}: context`)
]);

write('evidence/claims.csv', toCsv(lib.claims, [
  { label: 'key', get: (c) => c.key },
  { label: 'title', get: (c) => c.title },
  { label: 'area', get: (c) => c.area },
  { label: 'status', get: (c) => c.status },
  { label: 'statement', get: (c) => c.statement },
  { label: 'population', get: (c) => c.population },
  { label: 'what_the_app_does', get: (c) => c.appUse },
  { label: 'verified_supporting_sources', get: (c) => (c.sources || []).filter((id) => byId.has(id) && isVerified(byId.get(id))).length },
  { label: 'supporting_source_ids', get: (c) => c.sources || [] },
  { label: 'contradicting_source_ids', get: (c) => c.contradicting || [] },
  { label: 'context_source_ids', get: (c) => c.context || [] },
  { label: 'verdict', get: (c) => c.verdict },
  { label: 'evidence_gaps', get: (c) => c.gaps },
  { label: 'reviewed_at', get: (c) => c.reviewedAt }
]));

write('evidence/sources.csv', toCsv(lib.sources, [
  { label: 'id', get: (s) => s.id },
  { label: 'short', get: (s) => s.short },
  { label: 'title', get: (s) => s.title },
  { label: 'authors', get: (s) => s.authors },
  { label: 'year', get: (s) => s.year },
  { label: 'journal', get: (s) => s.journal },
  { label: 'citation', get: (s) => s.citation },
  { label: 'pmid', get: (s) => s.pmid },
  { label: 'pmcid', get: (s) => s.pmcid },
  { label: 'doi', get: (s) => s.doi },
  { label: 'link', get: (s) => sourceLink(s) },
  { label: 'design', get: (s) => s.design },
  { label: 'population', get: (s) => s.population },
  { label: 'sample_size', get: (s) => s.sampleSize },
  { label: 'what_it_found', get: (s) => s.found },
  { label: 'limitations', get: (s) => s.limitations },
  { label: 'abstract_quote', get: (s) => s.quote },
  { label: 'used_for', get: (s) => rolesFor(s) },
  { label: 'verified', get: (s) => (isVerified(s) ? 'yes' : 'no') },
  ...CHECKS.map((c) => ({ label: c, get: (s) => (s.checks ? s.checks[c] : '') })),
  { label: 'verified_at', get: (s) => s.verifiedAt },
  { label: 'verification_method', get: (s) => s.verification && s.verification.method },
  { label: 'verification_notes', get: (s) => s.verification && s.verification.notes }
]));

const ris = lib.sources.map((s) => {
  const p = bibParts(s.citation);
  const lines = ['TY  - JOUR', `TI  - ${s.title}`, ...authorList(s.authors).map((a) => `AU  - ${a}`), `PY  - ${s.year}`, `JO  - ${s.journal}`];
  if (p.volume) lines.push(`VL  - ${p.volume}`);
  if (p.issue) lines.push(`IS  - ${p.issue}`);
  if (p.start) lines.push(`SP  - ${p.start}`);
  if (p.end) lines.push(`EP  - ${p.end}`);
  if (s.doi) lines.push(`DO  - ${s.doi}`);
  if (s.pmid) lines.push(`AN  - PMID:${s.pmid}`);
  lines.push(`UR  - ${sourceLink(s)}`);
  if (s.found) lines.push(`N2  - ${s.found}`);
  lines.push(`N1  - ${s.design}. ${isVerified(s) ? 'Verified' : 'Not verified'} ${s.verifiedAt}. Used for: ${rolesFor(s).join('; ')}`);
  lines.push('ER  - ');
  return lines.join('\r\n');
}).join('\r\n\r\n') + '\r\n';
write('evidence/sources.ris', ris);

const bibEscape = (v) => String(v).replace(/[{}]/g, '').replace(/&/g, '\\&').replace(/%/g, '\\%');
const bib = lib.sources.map((s) => {
  const p = bibParts(s.citation);
  const fields = [
    ['title', `{${bibEscape(s.title)}}`],
    ['author', authorList(s.authors).map(bibEscape).join(' and ')],
    ['journal', bibEscape(s.journal)],
    ['year', s.year],
    p.volume && ['volume', p.volume],
    p.issue && ['number', p.issue],
    p.start && ['pages', p.end ? `${p.start}--${p.end}` : p.start],
    s.doi && ['doi', s.doi],
    s.pmid && ['pmid', s.pmid],
    ['url', sourceLink(s)],
    ['note', bibEscape(`${s.design}. ${isVerified(s) ? 'Verified' : 'Not verified'} ${s.verifiedAt}`)]
  ].filter(Boolean);
  return `@article{${s.id.replace(/^src-/, '').replace(/[^a-z0-9]+/gi, '_')},\n${fields.map(([k, v]) => `  ${k} = {${v}}`).join(',\n')}\n}`;
}).join('\n\n') + '\n';
write('evidence/sources.bib', bib);

function sourceMd(s) {
  const ids = [s.pmid && `PMID [${s.pmid}](https://pubmed.ncbi.nlm.nih.gov/${s.pmid}/)`, s.pmcid && `PMCID ${s.pmcid}`, s.doi && `DOI [${s.doi}](https://doi.org/${s.doi})`].filter(Boolean).join(' · ');
  return [
    `- **${s.short}.** ${s.title}. *${s.journal}* ${s.citation || s.year}. ${ids}`,
    `  - Design: ${s.design}${s.sampleSize ? ` (${s.sampleSize})` : ''}.`,
    `  - What it found: ${s.found}`,
    `  - Limitations: ${s.limitations}`,
    `  - Checks: ${isVerified(s) ? `all six passed, ${s.verifiedAt}` : CHECKS.filter((c) => !s.checks || s.checks[c] !== 'pass').map((c) => `${CHECK_WORDS[c].toLowerCase()}: ${s.checks ? s.checks[c] : 'unknown'}`).join('; ')}.`
  ].join('\n');
}
const areaOrder = ['training', 'recovery', 'measurement', 'nutrition'];
const claimsSorted = lib.claims.slice().sort((a, b) => areaOrder.indexOf(a.area) - areaOrder.indexOf(b.area) || (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1));
const md = [
  `# Evidence library`,
  '',
  `Generated from \`evidence/library.json\` (version ${lib.version}, reviewed ${lib.reviewedAt}).`,
  '',
  lib.method,
  '',
  `| Claim | Status | Verified supporting studies |`,
  `|---|---|---|`,
  ...claimsSorted.map((c) => `| [${c.title}](#${c.key.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}) | ${STATUS_WORDS[c.status]} | ${(c.sources || []).filter((id) => byId.has(id) && isVerified(byId.get(id))).length} |`),
  '',
  ...claimsSorted.flatMap((c) => [
    `## ${c.title}`,
    `<a id="${c.key.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}"></a>`,
    '',
    `\`${c.key}\` · **${STATUS_WORDS[c.status]}**`,
    '',
    `**Claim.** ${c.statement}`,
    '',
    `**Who it applies to.** ${c.population}`,
    '',
    `**What the app does with it.** ${c.appUse}`,
    '',
    `**Why this status.** ${c.verdict}`,
    '',
    ...(c.sources && c.sources.length ? ['### Supporting studies', '', ...c.sources.map((id) => sourceMd(byId.get(id))), ''] : []),
    ...(c.contradicting && c.contradicting.length ? ['### Contradicting or mixed evidence', '', ...c.contradicting.map((id) => sourceMd(byId.get(id))), ''] : []),
    ...(c.context && c.context.length ? ['### Context', '', ...c.context.map((id) => sourceMd(byId.get(id))), ''] : []),
    c.gaps ? `**What would change the status.** ${c.gaps}` : '',
    ''
  ]),
  '---',
  '',
  lib.disclaimer,
  ''
].join('\n');
write('evidence/evidence-library.md', md);

/* --------------------------------------------------------------- catalogue */
const cat = readJson('catalogue/catalogue.json');
const entries = cat.categories.flatMap((c) => c.entries.map((e) => ({ ...e, category: c.title })));
write('catalogue/datasets.csv', toCsv(entries, [
  { label: 'category', get: (e) => e.category },
  { label: 'name', get: (e) => e.name },
  { label: 'publisher', get: (e) => e.publisher },
  { label: 'priority', get: (e) => e.priority },
  { label: 'what_it_is', get: (e) => e.whatItIs },
  { label: 'use_in_app', get: (e) => e.useInApp },
  { label: 'what_to_download', get: (e) => e.recommendedDownload },
  { label: 'landing_page', get: (e) => e.landingUrl },
  { label: 'download_url', get: (e) => e.downloadUrl },
  { label: 'api_docs', get: (e) => e.apiDocsUrl },
  { label: 'formats', get: (e) => e.formats },
  { label: 'size', get: (e) => e.size },
  { label: 'licence', get: (e) => e.licence },
  { label: 'attribution', get: (e) => e.attributionRequired },
  { label: 'latest_release', get: (e) => e.latestRelease },
  { label: 'update_cadence', get: (e) => e.updateCadence },
  { label: 'access_notes', get: (e) => e.accessNotes },
  { label: 'key_fields', get: (e) => e.keyFields },
  { label: 'hosts_needed', get: (e) => e.hostsNeeded },
  { label: 'facts', get: (e) => e.facts },
  { label: 'verified', get: (e) => (e.verified ? 'yes' : 'no') },
  { label: 'checked_at', get: (e) => e.checkedAt },
  { label: 'sources_checked', get: (e) => e.evidenceUrls }
]));

const hosts = [...new Set(entries.filter((e) => e.priority === 'essential').flatMap((e) => e.hostsNeeded || []))].sort();
const catMd = [
  '# What to download',
  '',
  cat.intro,
  '',
  '## Hosts to allow',
  '',
  'To download these from a cloud session, or for the app\'s servers to call them, allow these hosts:',
  '',
  ...hosts.map((h) => `- \`${h}\``),
  '',
  ...cat.categories.flatMap((c) => [
    `## ${c.title}`,
    '',
    c.summary || '',
    '',
    ...c.entries.flatMap((e) => [
      `### ${e.name}${e.priority === 'essential' ? ' (essential)' : e.priority === 'useful' ? ' (useful)' : ''}`,
      '',
      `${e.whatItIs}`,
      '',
      `- **Download first:** ${e.recommendedDownload}`,
      `- **Where:** ${e.downloadUrl || e.landingUrl}${e.apiDocsUrl ? ` · API: ${e.apiDocsUrl}` : ''}`,
      `- **Format and size:** ${e.formats}${e.size ? `; ${e.size}` : ''}`,
      `- **Licence:** ${e.licence}${e.attributionRequired ? `. ${e.attributionRequired}` : ''}`,
      e.latestRelease ? `- **Latest release:** ${e.latestRelease}${e.updateCadence ? `; ${e.updateCadence}` : ''}` : null,
      `- **Access:** ${e.accessNotes}`,
      `- **In the app:** ${e.useInApp}`,
      e.facts ? `- **Facts the app relies on:** ${e.facts}` : null,
      `- **Checked:** ${e.verified ? `confirmed ${e.checkedAt}` : `not independently confirmed (${e.checkedAt})`}`,
      ''
    ].filter((x) => x !== null))
  ])
].join('\n');
write('catalogue/what-to-download.md', catMd);

console.log(`data: ${lib.claims.length} claims, ${lib.sources.length} sources (${lib.sources.filter(isVerified).length} verified), ${entries.length} catalogue entries`);
