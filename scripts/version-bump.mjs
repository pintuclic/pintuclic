#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHANGELOG_PATH = 'docs/CHANGELOG.md';
const CHANGELOG_HEADER = '# Registro de Cambios y Versiones (CHANGELOG) - PINTU CLIC\n\n';
const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)$/;
const BRACKET_GLOBAL_RE = /\[v?(\d+)\.(\d+)\.(\d+)\]/g;
const BOT_SUBJECT_RE = /\[skip ci\]|^chore\(release\):|^Merge\b/i;
const WALKTHROUGH_GLOBAL_RE = /docs\/walkthroughs\/[A-Za-z0-9_\-./]+\.md/g;
const LEVEL_RANK = { patch: 1, minor: 2, major: 3 };

export function parseVersion(value) {
  const match = SEMVER_RE.exec(String(value || '').trim());
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function bumpLevelOf(value) {
  const version = parseVersion(value);
  if (!version) return null;
  if (version.major > 0) return 'major';
  if (version.minor > 0) return 'minor';
  if (version.patch > 0) return 'patch';
  return null;
}

export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) throw new Error(`Version invalida: ${!a ? left : right}`);
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

export function maxVersion(values) {
  const valid = values.filter((value) => parseVersion(value));
  if (!valid.length) return null;
  return [...valid].sort(compareVersions).at(-1).replace(/^v/, '');
}

export function applyBump(baseVersion, level) {
  const version = parseVersion(baseVersion);
  if (!version) throw new Error(`Version base invalida: ${baseVersion}`);
  if (level === 'major') return `${version.major + 1}.0.0`;
  if (level === 'minor') return `${version.major}.${version.minor + 1}.0`;
  if (level === 'patch') return `${version.major}.${version.minor}.${version.patch + 1}`;
  return formatVersion(version);
}

export function findBumpLevel(subjects) {
  let best = null;
  for (const subject of subjects) {
    const line = String(subject || '').trim();
    if (!line || BOT_SUBJECT_RE.test(line)) continue;
    BRACKET_GLOBAL_RE.lastIndex = 0;
    let match;
    while ((match = BRACKET_GLOBAL_RE.exec(line)) !== null) {
      const level = bumpLevelOf(`${match[1]}.${match[2]}.${match[3]}`);
      if (level && (!best || LEVEL_RANK[level] > LEVEL_RANK[best])) best = level;
    }
  }
  return best;
}

export function parseCurrentVersion(changelog) {
  const match = /^##\s+\[v?(\d+\.\d+\.\d+)\]/m.exec(String(changelog || ''));
  return match ? match[1] : null;
}

export function hasVersion(changelog, version) {
  const escaped = String(version).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^##\\s+\\[v?${escaped}\\]`, 'm').test(String(changelog || ''));
}

export function extractWalkthroughs(texts) {
  const found = new Set();
  for (const text of texts) {
    WALKTHROUGH_GLOBAL_RE.lastIndex = 0;
    let match;
    while ((match = WALKTHROUGH_GLOBAL_RE.exec(String(text || ''))) !== null) {
      found.add(match[0].replace(/[.,;:)]+$/, ''));
    }
  }
  return [...found].sort();
}

export function sanitizeInline(text) {
  return String(text || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/`/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseScope(subject) {
  const match = /^[a-z]+(?:\(([^)]+)\))?!?:/i.exec(String(subject || '').trim());
  return match && match[1] ? match[1] : 'General';
}

export function moduleLabel(scope) {
  const match = /^m(\d{2})$/i.exec(String(scope || '').trim());
  if (match) return `M${match[1]}`;
  const clean = sanitizeInline(scope);
  return clean ? clean.toUpperCase() : 'General';
}

export function buildEntry({ version, date, level, commits, walkthroughs }) {
  const groups = new Map();
  const ensureGroup = (scope) => {
    if (!groups.has(scope)) groups.set(scope, { commits: [], walkthroughs: [] });
    return groups.get(scope);
  };
  for (const commit of commits) ensureGroup(moduleLabel(parseScope(commit.subject))).commits.push(commit);
  for (const link of walkthroughs) {
    const match = /docs\/walkthroughs\/([^/]+)\//.exec(link);
    ensureGroup(match ? moduleLabel(match[1]) : 'General').walkthroughs.push(link);
  }
  const lines = [`## [v${version}] - ${date}`];
  lines.push(`> Entrada generada automaticamente por el bot de versionado (nivel ${String(level || 'n/a').toUpperCase()}).`);
  lines.push('');
  for (const [scope, group] of groups) {
    lines.push(`### Modulo: ${scope}`);
    lines.push(`- **Alcance:** ${group.commits.length} cambio(s) integrado(s) en esta version.`);
    if (group.commits.length) {
      lines.push('- **Cambios incluidos:**');
      for (const commit of group.commits) {
        lines.push(`  - \`${sanitizeInline(commit.subject)}\` (\`${commit.sha}\`)`);
      }
    }
    if (group.walkthroughs.length) {
      lines.push('- 🔗 **Walkthrough(s) Tecnico(s):**');
      for (const link of group.walkthroughs) {
        const relative = link.replace(/^docs\//, '');
        lines.push(`  - [${relative}](./${relative})`);
      }
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}

export function upsertEntry(changelog, entry, version) {
  const content = String(changelog || '');
  if (hasVersion(content, version)) return { changelog: content, changed: false };
  const firstSection = /^##\s+\[/m.exec(content);
  if (!firstSection) {
    const separator = content.length ? (content.endsWith('\n') ? '\n' : '\n\n') : '';
    return { changelog: `${content}${separator}${entry}`, changed: true };
  }
  const head = content.slice(0, firstSection.index);
  const tail = content.slice(firstSection.index);
  return { changelog: `${head}${entry}\n---\n\n${tail}`, changed: true };
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
}

function gitOk(args) {
  try {
    git(args);
    return true;
  } catch {
    return false;
  }
}

function listTags() {
  const raw = git(['tag', '--list']);
  return raw ? raw.split('\n').map((tag) => tag.trim()).filter(Boolean) : [];
}

function tagVersion(tag) {
  const match = SEMVER_RE.exec(String(tag).trim());
  return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
}

function isAncestor(tag, target) {
  return gitOk(['merge-base', '--is-ancestor', tag, target]);
}

function findTagForVersion(version, target = 'HEAD') {
  if (!version) return null;
  const candidates = listTags().filter((tag) => tagVersion(tag) === version);
  const preferred = `v${version}`;
  if (candidates.includes(preferred) && isAncestor(preferred, target)) return preferred;
  return candidates.find((tag) => isAncestor(tag, target)) || null;
}

function latestAncestorTag(target = 'HEAD') {
  const tags = listTags().filter((tag) => tagVersion(tag));
  tags.sort((left, right) => compareVersions(tagVersion(right), tagVersion(left)));
  return tags.find((tag) => isAncestor(tag, target)) || null;
}

function resolveBaseVersion() {
  const candidates = [parseCurrentVersion(readChangelog()), maxVersion(listTags().map(tagVersion).filter(Boolean))]
    .filter(Boolean);
  if (!candidates.length) return '0.0.0';
  return [...candidates].sort(compareVersions).at(-1);
}

function resolveRange(from, to, baseForRange) {
  const target = to || 'HEAD';
  if (from && !/^0+$/.test(String(from)) && gitOk(['rev-parse', '--verify', `${from}^{commit}`])) {
    return `${from}..${target}`;
  }
  const tag = findTagForVersion(baseForRange || resolveBaseVersion(), target);
  if (tag) return `${tag}..${target}`;
  const latestTag = latestAncestorTag(target);
  if (latestTag) return `${latestTag}..${target}`;
  return target;
}

function readChangelog() {
  return existsSync(CHANGELOG_PATH) ? readFileSync(CHANGELOG_PATH, 'utf8') : '';
}

function readSubjects(range) {
  const raw = git(['log', '--format=%s', range]);
  return raw ? raw.split('\n') : [];
}

function collectCommits(range) {
  const raw = git(['log', '--format=%h%x1f%s', range]);
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => {
      const [sha, subject] = line.split('\x1f');
      return { sha, subject };
    })
    .filter((commit) => commit.sha && commit.subject && !BOT_SUBJECT_RE.test(commit.subject));
}

function collectWalkthroughs(range) {
  const raw = git(['log', '--format=%B%x1f', range]);
  return extractWalkthroughs([raw]);
}

function buildReleaseNotes({ version, level, base, commits, walkthroughs }) {
  const lines = [`# v${version}`, '', `Nivel: **${String(level).toUpperCase()}** (base v${base})`, '', '## Cambios incluidos'];
  if (!commits.length) lines.push('- Sin commits de codigo detectados.');
  for (const commit of commits) lines.push(`- \`${sanitizeInline(commit.subject)}\` (\`${commit.sha}\`)`);
  if (walkthroughs.length) {
    lines.push('', '## Walkthroughs');
    for (const link of walkthroughs) lines.push(`- ${link}`);
  }
  return lines.join('\n') + '\n';
}

function setOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, 'utf8');
}

function writeNotes(notesPath, content) {
  if (notesPath) writeFileSync(notesPath, content, 'utf8');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function commandCompute(options) {
  const base = resolveBaseVersion();
  const range = resolveRange(options.from, options.to, base);
  const subjects = readSubjects(range);
  const level = findBumpLevel(subjects);
  if (!level) {
    setOutput('has_bump', 'false');
    writeNotes(options['notes-out'], `# Sin incremento de version\n\nNo se encontraron marcas [X.Y.Z] en el rango ${range}.\n`);
    if (options.json) {
      console.log(JSON.stringify({ has_bump: false, base_version: base, new_version: null, bump_level: null, range, commits: [], walkthroughs: [] }));
      return;
    }
    console.log(`Sin bump: no hay marcas [X.Y.Z] en ${range}`);
    return;
  }
  const version = applyBump(base, level);
  const commits = collectCommits(range);
  const walkthroughs = collectWalkthroughs(range);
  setOutput('has_bump', 'true');
  setOutput('base_version', base);
  setOutput('new_version', version);
  setOutput('bump_level', level);
  writeNotes(options['notes-out'], buildReleaseNotes({ version, level, base, commits, walkthroughs }));
  if (options.json) {
    console.log(JSON.stringify({ has_bump: true, base_version: base, new_version: version, bump_level: level, range, commits, walkthroughs }));
    return;
  }
  console.log(`Bump ${level.toUpperCase()}: v${base} -> v${version} (rango ${range})`);
}

function commandWriteChangelog(options) {
  const parsed = parseVersion(options.version);
  if (!parsed) throw new Error('Debes indicar --version X.Y.Z');
  const version = formatVersion(parsed);
  const changelog = readChangelog();
  if (hasVersion(changelog, version)) {
    setOutput('changed', 'false');
    console.log(`La version v${version} ya existe en ${CHANGELOG_PATH}; no se modifica.`);
    return;
  }
  const previous = parseCurrentVersion(changelog);
  const range = resolveRange(options.from, options.to, previous);
  const commits = collectCommits(range);
  const walkthroughs = collectWalkthroughs(range);
  const entry = buildEntry({ version, date: today(), level: options.level || null, commits, walkthroughs });
  const content = changelog || CHANGELOG_HEADER;
  const result = upsertEntry(content, entry, version);
  writeFileSync(CHANGELOG_PATH, result.changelog, 'utf8');
  setOutput('changed', 'true');
  console.log(`CHANGELOG actualizado con v${version} (rango ${range}).`);
  console.log(entry);
}

function commandCheckPr(options) {
  const texts = [];
  if (options.file) {
    if (!existsSync(options.file)) throw new Error(`No existe el archivo: ${options.file}`);
    texts.push(readFileSync(options.file, 'utf8'));
  }
  if (options.from && options.to && gitOk(['rev-parse', '--verify', `${options.from}^{commit}`])) {
    texts.push(git(['log', '--format=%s', `${options.from}..${options.to}`]));
  }
  const subjects = texts.flatMap((text) => String(text || '').split('\n'));
  const level = findBumpLevel(subjects);
  if (level) {
    console.log(`OK: marca de version valida detectada (nivel ${level.toUpperCase()}).`);
    return;
  }
  console.error('Falta la marca de version en el titulo o en los commits del PR.');
  console.error('Formato requerido: tipo(modulo): [X.Y.Z] descripcion');
  console.error('Nivel relativo: [0.0.1] = PATCH, [0.1.0] = MINOR, [1.0.0] = MAJOR.');
  console.error('Ejemplo: feat(M01): [0.1.0] implementar consulta publica de catalogo');
  process.exitCode = 1;
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = args[index + 1];
    if (next === undefined || next.startsWith('--')) {
      options[key] = true;
    } else {
      options[key] = next;
      index += 1;
    }
  }
  return options;
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const options = parseArgs(rest);
  try {
    if (command === 'compute') commandCompute(options);
    else if (command === 'write-changelog') commandWriteChangelog(options);
    else if (command === 'check-pr') commandCheckPr(options);
    else throw new Error(`Comando no reconocido: ${command || '(vacio)'}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
