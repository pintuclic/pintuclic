#!/usr/bin/env node
/**
 * Motor de versionado automatico de Pintu Clic.
 *
 * Comandos:
 *   validate  Valida el titulo de la PR, la version siguiente segun la tabla de
 *             CONTRIBUTING.md, la coincidencia de .github/version.txt y la
 *             entrada de docs/CHANGELOG.md. Lo usa el workflow pr-title-lint.
 *   release   Publica el tag anotado y el Release de la PR fusionada que llego a
 *             main/develop. Las ramas estan protegidas (rulesets), por lo que el
 *             bot NO crea commits: solo etiqueta el commit fusionado y publica.
 *
 * Sin dependencias externas: requiere Node >= 18, git y la CLI gh autenticada.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const VERSION_FILE = '.github/version.txt';
export const CHANGELOG_FILE = 'docs/CHANGELOG.md';
export const ZERO_VERSION = '0.0.0.0';

const SEGMENT = '(0|[1-9][0-9]*)';
const VERSION_RE = new RegExp(`^${SEGMENT}\\.${SEGMENT}\\.${SEGMENT}\\.${SEGMENT}$`);
const TITLE_RE = new RegExp(
  `^(?<type>[A-Za-z0-9_-]+)(?:\\((?<scope>[A-Za-z0-9_.-]+)\\))? \\[v?(?<version>${SEGMENT}\\.${SEGMENT}\\.${SEGMENT}\\.${SEGMENT})\\]: (?<message>\\S.*)$`,
);

export const ROWS = {
  mayor: { name: 'Mayor', pattern: '1.X.X.X' },
  'minior-estable': { name: 'Minior estable', pattern: 'X.1.X.X' },
  'minior-feat': { name: 'Minior-feat', pattern: 'X.X.1.X' },
  patch: { name: 'Patch', pattern: 'X.X.X.1' },
};

/**
 * Devuelve los cuatro segmentos numericos de una version X.Y.Z.W, o null.
 * @param {string} value
 * @returns {number[] | null}
 */
export function parseVersion(value) {
  const text = String(value ?? '').trim();
  if (!VERSION_RE.test(text)) return null;
  return text.split('.').map(Number);
}

/**
 * Calcula las cuatro versiones validas siguientes segun la tabla de CONTRIBUTING.md.
 * @param {string} value version actual X.Y.Z.W
 * @returns {Record<string, string>}
 */
export function nextVersions(value) {
  const parsed = parseVersion(value);
  if (!parsed) {
    throw new Error(`Version invalida: "${value}". Se esperaba el formato X.Y.Z.W.`);
  }
  const [major, minor, patch, build] = parsed;
  return {
    mayor: `${major + 1}.0.0.0`,
    'minior-estable': `${major}.${minor + 1}.0.0`,
    'minior-feat': `${major}.${minor}.${patch + 1}.0`,
    patch: `${major}.${minor}.${patch}.${build + 1}`,
  };
}

/**
 * Clasifica el salto entre dos versiones. Devuelve la fila de la tabla o null.
 * @param {string} base
 * @param {string} target
 * @returns {string | null}
 */
export function classifyStep(base, target) {
  const options = nextVersions(base);
  for (const [row, version] of Object.entries(options)) {
    if (version === target) return row;
  }
  return null;
}

/**
 * Analiza el titulo de la PR: `tipo(scope) [X.Y.Z.W]: mensaje`.
 * @param {string} title
 * @returns {{ ok: true, value: { type: string, scope: string | null, version: string, message: string } } | { ok: false, error: string }}
 */
export function parseTitle(title) {
  const text = String(title ?? '').trim();
  if (!text) return { ok: false, error: 'El titulo de la PR esta vacio.' };
  const match = TITLE_RE.exec(text);
  if (!match) {
    return {
      ok: false,
      error: 'El titulo no cumple el formato "tipo(scope) [X.Y.Z.W]: mensaje" (ej. "feat(carrito) [0.4.8.0]: agregar panel lateral").',
    };
  }
  const { type, scope = null, version, message } = match.groups;
  return { ok: true, value: { type, scope, version, message } };
}

/**
 * Verifica si el changelog contiene la entrada de la version indicada.
 * @param {string} version
 * @param {string} content
 * @returns {boolean}
 */
export function changelogHasVersion(version, content) {
  return String(content ?? '').includes(`## [v${version}]`);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extrae el bloque de la entrada de la version indicada dentro del changelog.
 * @param {string} version
 * @param {string} content
 * @returns {string | null}
 */
export function extractChangelogEntry(version, content) {
  const text = String(content ?? '');
  const start = new RegExp(`^## \\[v${escapeRegex(version)}\\]`, 'm').exec(text);
  if (!start) return null;
  const rest = text.slice(start.index);
  const next = /^## \[/m.exec(rest.slice(1));
  return next ? rest.slice(0, 1 + next.index) : rest;
}

/**
 * Valida la entrada del changelog: encabezado con fecha AAAA-MM-DD y autor real.
 * @param {string} version
 * @param {string} content
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateChangelogEntry(version, content) {
  const errors = [];
  const entry = extractChangelogEntry(version, content);
  if (!entry) {
    errors.push(`Falta la entrada "## [v${version}] - AAAA-MM-DD" en ${CHANGELOG_FILE}.`);
    return { ok: false, errors };
  }
  const heading = entry.split('\n', 1)[0].trim();
  const headingRe = new RegExp(`^## \\[v${escapeRegex(version)}\\] - \\d{4}-\\d{2}-\\d{2}$`);
  if (!headingRe.test(heading)) {
    errors.push(`El encabezado de la entrada debe ser "## [v${version}] - AAAA-MM-DD" con la fecha real de la entrega.`);
  }
  if (!/^- \*\*Autor:\*\* .+\(@[A-Za-z0-9-]+\)\s*$/m.test(entry)) {
    errors.push('La entrada debe incluir "- **Autor:** Nombre (@usuario)" con la persona real de la entrega (nunca la IA).');
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Validacion completa usada por el lint y reutilizada por el bot.
 * @param {{ title: string, base: string, fileVersion: string, changelogContent?: string | null }} input
 * @returns {{ ok: boolean, errors: string[], version: string | null, row: string | null }}
 */
export function validateInput({ title, base, fileVersion, changelogContent = null }) {
  const errors = [];
  const parsed = parseTitle(title);
  if (!parsed.ok) {
    return { ok: false, errors: [parsed.error], version: null, row: null };
  }
  const { version } = parsed.value;
  const row = classifyStep(base, version);
  if (!row) {
    const options = nextVersions(base);
    errors.push(
      `La version ${version} no es el siguiente paso desde ${base}. Opciones validas: ` +
        `${options.mayor} (Mayor), ${options['minior-estable']} (Minior estable), ` +
        `${options['minior-feat']} (Minior-feat) o ${options.patch} (Patch).`,
    );
  }
  if (fileVersion !== version) {
    errors.push(`${VERSION_FILE} contiene "${fileVersion}" y el titulo declara "${version}"; deben coincidir.`);
  }
  if (changelogContent !== null) {
    errors.push(...validateChangelogEntry(version, changelogContent).errors);
  }
  return { ok: errors.length === 0, errors, version, row };
}

/**
 * Genera las notas del Release: solo PRs, cada una una unica vez.
 * @param {{ branch: string, prs?: Array<{ number: number, title: string, login: string }>, manual?: boolean }} input
 * @returns {string}
 */
export function releaseNotes({ branch, prs = [], manual = false }) {
  const channel =
    branch === 'main' ? 'main (estable)' : branch === 'develop' ? 'develop (pre-release)' : `${branch} (sin canal)`;
  const lines = [`Canal: ${channel}`, '', '### Cambios'];
  if (manual) {
    lines.push('- Ejecucion manual del workflow Version.');
  } else {
    for (const pr of prs) {
      lines.push(`- #${pr.number} ${pr.title} — por @${pr.login}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Ejecuta un comando y devuelve el resultado completo.
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ allowFailure?: boolean }} [options]
 */
function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`"${cmd} ${args.join(' ')}" fallo (exit ${result.status}): ${detail}`);
  }
  return result;
}

function gitOut(args) {
  return run('git', args).stdout.trim();
}

function gitOk(args) {
  return run('git', args, { allowFailure: true });
}

function warn(message) {
  console.log(`::warning::${message}`);
}

function tagExists(tag) {
  return gitOk(['rev-parse', '-q', '--verify', `refs/tags/${tag}`]).status === 0;
}

function releaseExists(tag) {
  return run('gh', ['release', 'view', tag], { allowFailure: true }).status === 0;
}

function readVersionAt(rev) {
  const result = gitOk(['show', `${rev}:${VERSION_FILE}`]);
  if (result.status !== 0) return null;
  const value = result.stdout.trim();
  return parseVersion(value) ? value : null;
}

function readVersionFile() {
  if (!existsSync(VERSION_FILE)) return null;
  const value = readFileSync(VERSION_FILE, 'utf8').trim();
  return parseVersion(value) ? value : null;
}

function readChangelogAt(rev) {
  const result = gitOk(['show', `${rev}:${CHANGELOG_FILE}`]);
  return result.status === 0 ? result.stdout : '';
}

function createTag(tag, message, sha) {
  gitOut(['tag', '-a', tag, '-m', message, sha]);
  console.log(`Tag ${tag} creado sobre ${sha.slice(0, 7)}.`);
}

function ensureRelease({ tag, version, notes, promote }) {
  const notesFile = join(tmpdir(), `${tag}-notes.md`);
  writeFileSync(notesFile, notes);
  if (promote) {
    if (releaseExists(tag)) {
      run('gh', ['release', 'edit', tag, '--title', `v${version}`, '--notes-file', notesFile, '--prerelease=false']);
      run('gh', ['release', 'edit', tag, '--latest']);
      console.log(`Release ${tag} promovido a estable.`);
    } else {
      run('gh', ['release', 'create', tag, '--title', `v${version}`, '--notes-file', notesFile, '--latest']);
      console.log(`Release ${tag} publicado como estable.`);
    }
  } else if (!releaseExists(tag)) {
    run('gh', ['release', 'create', tag, '--title', `v${version} (pre-release)`, '--notes-file', notesFile, '--prerelease']);
    console.log(`Release ${tag} publicado como pre-release.`);
  } else {
    console.log(`Release ${tag} ya existe; no se modifica en develop.`);
  }
}

/**
 * Obtiene las PRs fusionadas asociadas a un commit.
 * @param {string} sha
 * @returns {Array<{ pr: any, sha: string }>}
 */
function pullsForCommit(sha) {
  const result = run('gh', ['api', `repos/${process.env.GITHUB_REPOSITORY}/commits/${sha}/pulls`], {
    allowFailure: true,
  });
  if (result.status !== 0) return [];
  let list;
  try {
    list = JSON.parse(result.stdout);
  } catch {
    return [];
  }
  const merged = list.filter((pr) => pr.merged_at);
  const exact = merged.filter((pr) => (pr.merge_commit_sha || '').toLowerCase() === sha.toLowerCase());
  const chosen = exact.length > 0 ? exact : merged;
  return chosen.map((pr) => ({
    pr: {
      number: pr.number,
      title: pr.title || '',
      login: (pr.user && pr.user.login) || 'desconocido',
      merged_at: pr.merged_at,
    },
    sha,
  }));
}

function commitRange(before, after) {
  if (!before || /^0+$/.test(before)) return [];
  if (gitOk(['merge-base', '--is-ancestor', before, after]).status !== 0) return [];
  const result = gitOk(['rev-list', '--reverse', `${before}..${after}`]);
  if (result.status !== 0) return [];
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function resolvePrs({ before, after }) {
  const direct = pullsForCommit(after);
  if (direct.length > 0) return direct;
  const collected = new Map();
  for (const sha of commitRange(before, after).slice(-20)) {
    for (const item of pullsForCommit(sha)) {
      if (!collected.has(item.pr.number)) collected.set(item.pr.number, item);
    }
  }
  return [...collected.values()].sort((a, b) => String(a.pr.merged_at).localeCompare(String(b.pr.merged_at)));
}

function writeSummary(lines) {
  const body = ['### Version', '', ...lines.map((line) => `- ${line}`), ''].join('\n');
  console.log(body);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    try {
      writeFileSync(summaryPath, `${body}\n`, { flag: 'a' });
    } catch {
      /* el resumen es opcional */
    }
  }
}

function cmdRelease() {
  const branch = process.env.BRANCH || '';
  const eventName = process.env.EVENT_NAME || 'push';
  const isMain = branch === 'main';
  const isDevelop = branch === 'develop';
  const summary = [];
  const pending = [];

  gitOut(['config', 'user.name', 'pintuclic-version-bot']);
  gitOut(['config', 'user.email', 'pintuclic-version-bot@users.noreply.github.com']);

  if (eventName === 'workflow_dispatch') {
    if (!isMain && !isDevelop) {
      warn(`La ejecucion manual de Version solo publica en main/develop (rama actual: ${branch}).`);
      writeSummary([`Rama ${branch}: sin publicacion.`]);
      return;
    }
    const fileVersion = readVersionFile();
    if (!fileVersion) throw new Error(`No se pudo leer una version valida en ${VERSION_FILE}.`);
    const requested = (process.env.INPUT_VERSION || '').trim();
    const target = requested || fileVersion;
    if (!parseVersion(target)) throw new Error(`La version indicada "${target}" no cumple el formato X.Y.Z.W.`);
    if (target !== fileVersion) {
      throw new Error(
        `La version indicada (${target}) no coincide con ${VERSION_FILE} (${fileVersion}). ` +
          'En ramas protegidas la version se cambia unicamente mediante PR.',
      );
    }
    const tag = `v${target}`;
    if (tagExists(tag)) {
      ensureRelease({ tag, version: target, notes: releaseNotes({ branch, manual: true }), promote: isMain });
      summary.push(`El tag ${tag} ya existia; Release verificado.`);
    } else {
      const head = gitOut(['rev-parse', 'HEAD']);
      createTag(tag, `Release ${tag} (ejecucion manual)`, head);
      pending.push({ tag, version: target, notes: releaseNotes({ branch, manual: true }), promote: isMain });
      summary.push(`Tag ${tag} creado en ${head.slice(0, 7)}.`);
    }
  } else {
    const after = (process.env.AFTER_COMMIT || '').trim() || gitOut(['rev-parse', 'HEAD']);
    const before = (process.env.BEFORE_COMMIT || '').trim();
    const found = resolvePrs({ before, after });
    if (found.length === 0) {
      warn('No se encontro una PR fusionada asociada al push; no hay nada que versionar.');
      writeSummary(['Sin PR asociada: no se publico nada.']);
      return;
    }
    const parent = gitOk(['rev-parse', 'HEAD^']);
    let previous = parent.status === 0 ? readVersionAt('HEAD^') || ZERO_VERSION : ZERO_VERSION;

    for (const { pr, sha } of found) {
      const parsed = parseTitle(pr.title || '');
      if (!parsed.ok) {
        warn(`La PR #${pr.number} no declara una version valida ("${pr.title}"); se omite.`);
        summary.push(`#${pr.number}: omitida (titulo sin version valida).`);
        continue;
      }
      const version = parsed.value.version;
      const tag = `v${version}`;
      if (tagExists(tag)) {
        ensureRelease({ tag, version, notes: releaseNotes({ branch, prs: [pr] }), promote: isMain });
        summary.push(`#${pr.number}: el tag ${tag} ya existia; Release asegurado.`);
        continue;
      }
      const row = classifyStep(previous, version);
      if (!row) {
        warn(`#${pr.number}: la version ${version} no es el siguiente paso desde ${previous}; no se publica.`);
        summary.push(`#${pr.number}: omitida (${version} no sigue a ${previous}).`);
        continue;
      }
      const fileVersion = readVersionAt(sha) || readVersionFile();
      if (fileVersion !== version) {
        warn(
          `#${pr.number}: ${VERSION_FILE} en el merge contiene "${fileVersion}" y el titulo declara "${version}"; ` +
            'no se publica para conservar la coincidencia.',
        );
        summary.push(`#${pr.number}: omitida (${VERSION_FILE} no coincide).`);
        continue;
      }
      const changelogErrors = validateChangelogEntry(version, readChangelogAt(sha)).errors;
      if (changelogErrors.length > 0) {
        warn(`#${pr.number}: ${changelogErrors.join(' ')} El Release se publica igualmente.`);
      }
      createTag(tag, `Release ${tag} — ${parsed.value.message} (#${pr.number} por @${pr.login})`, sha);
      pending.push({ tag, version, notes: releaseNotes({ branch, prs: [pr] }), promote: isMain });
      summary.push(`#${pr.number}: ${tag} (${ROWS[row].name}) creado en ${sha.slice(0, 7)}.`);
      previous = version;
    }
  }

  if (pending.length > 0) {
    console.log(`Publicando tags: ${pending.map((item) => item.tag).join(', ')}`);
    gitOut(['push', 'origin', ...pending.map((item) => `refs/tags/${item.tag}`)]);
    for (const item of pending) ensureRelease(item);
  }
  writeSummary(summary.length > 0 ? summary : ['Sin cambios que publicar.']);
}

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags[key] = next;
      i += 1;
    } else {
      flags[key] = 'true';
    }
  }
  return flags;
}

function cmdValidate(flags) {
  const title = flags.title ?? '';
  const base = flags.base && parseVersion(flags.base) ? flags.base : ZERO_VERSION;
  const fileVersion = flags['file-version'] ?? '';
  const changelogFile = flags['changelog-file'] ?? CHANGELOG_FILE;
  const changelogContent = existsSync(changelogFile) ? readFileSync(changelogFile, 'utf8') : '';
  const result = validateInput({ title, base, fileVersion, changelogContent });
  if (result.ok) {
    console.log(
      `OK: v${result.version} (${ROWS[result.row].name}, ${ROWS[result.row].pattern}); ` +
        `${VERSION_FILE} y ${CHANGELOG_FILE} coinciden.`,
    );
    return;
  }
  for (const error of result.errors) {
    console.error(`::error::${error}`);
  }
  process.exitCode = 1;
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const flags = parseFlags(rest);
  if (command === 'validate') {
    cmdValidate(flags);
    return;
  }
  if (command === 'release') {
    cmdRelease();
    return;
  }
  console.error('Uso: versioning.mjs <validate|release> [opciones]');
  process.exitCode = 2;
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isDirectRun) {
  main().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exit(1);
  });
}
