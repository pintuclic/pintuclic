import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyBump,
  buildEntry,
  bumpLevelOf,
  compareVersions,
  extractWalkthroughs,
  findBumpLevel,
  formatVersion,
  hasVersion,
  maxVersion,
  parseCurrentVersion,
  parseScope,
  parseVersion,
  upsertEntry,
} from './version-bump.mjs';

const SCRIPT_PATH = fileURLToPath(new URL('./version-bump.mjs', import.meta.url));

function gitRun(cwd, ...args) {
  return execFileSync(
    'git',
    ['-c', 'commit.gpgsign=false', '-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args],
    {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' },
    },
  );
}

function createRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'version-bump-'));
  gitRun(dir, 'init', '-q');
  return dir;
}

function commitFile(dir, name, content, message) {
  writeFileSync(path.join(dir, name), content, 'utf8');
  gitRun(dir, 'add', name);
  gitRun(dir, 'commit', '-q', '-m', message);
}

function runCli(cwd, ...args) {
  return execFileSync(process.execPath, [SCRIPT_PATH, ...args], { cwd, encoding: 'utf8' });
}

test('bumpLevelOf interpreta la senal relativa del documento', () => {
  assert.equal(bumpLevelOf('0.1.0'), 'minor');
  assert.equal(bumpLevelOf('0.0.1'), 'minor');
  assert.equal(bumpLevelOf('0.0.0'), 'minor');
  assert.equal(bumpLevelOf('0.9.9'), 'minor');
  assert.equal(bumpLevelOf('1.0.0'), 'major');
  assert.equal(bumpLevelOf('2.5.1'), 'major');
  assert.equal(bumpLevelOf('invalido'), null);
});

test('applyBump aplica el efecto odometro sobre la version base', () => {
  assert.equal(applyBump('3.12.4', 'minor'), '3.13.0');
  assert.equal(applyBump('3.13.0', 'major'), '4.0.0');
  assert.equal(applyBump('1.5.4', 'minor'), '1.6.0');
  assert.equal(applyBump('1.5.4', 'major'), '2.0.0');
});

test('findBumpLevel usa el commit mas reciente con marca y descarta commits del bot', () => {
  const newestFirst = [
    'chore(release): [skip ci] registrar v3.29.0 en CHANGELOG',
    'Merge branch develop into release',
    'docs: actualizar readme',
    'fix(M01): [0.0.1] corregir validacion',
    'feat(M04): [1.0.0] cambio grande',
  ];
  assert.equal(findBumpLevel(newestFirst), 'minor');
  assert.equal(findBumpLevel(['feat(M04): [1.0.0] breaking', 'fix(M01): [0.0.1] ajuste']), 'major');
  assert.equal(findBumpLevel(['docs: sin marca', 'Merge pull request #1']), null);
  assert.equal(findBumpLevel([]), null);
});

test('parseVersion y compareVersions funcionan con prefijo v', () => {
  assert.deepEqual(parseVersion('v3.12.4'), { major: 3, minor: 12, patch: 4 });
  assert.equal(parseVersion('3.12'), null);
  assert.ok(compareVersions('3.12.4', '3.13.0') < 0);
  assert.ok(compareVersions('4.0.0', '3.99.99') > 0);
  assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
});

test('maxVersion devuelve la mayor version semver', () => {
  assert.equal(maxVersion(['0.1.0', '3.12.4', '3.9.9', 'invalida']), '3.12.4');
  assert.equal(maxVersion([]), null);
});

test('parseCurrentVersion lee la primera entrada del CHANGELOG', () => {
  const changelog = '# CHANGELOG\n\n## [v3.28.0] - 2026-09-13\n### Modulo: CORE\n\n## [v3.27.0] - 2026-09-11\n';
  assert.equal(parseCurrentVersion(changelog), '3.28.0');
  assert.equal(parseCurrentVersion('sin entradas'), null);
});

test('extractWalkthroughs detecta rutas unicas y ordenadas', () => {
  const links = extractWalkthroughs([
    'Ver docs/walkthroughs/M01/walkthrough_v3.27.0_M01_backend.md y docs/walkthroughs/M01/walkthrough_v3.27.0_M01_backend.md',
    'docs/walkthroughs/CORE/walkthrough_v3.28.0_CORE_frontend.md.',
  ]);
  assert.deepEqual(links, [
    'docs/walkthroughs/CORE/walkthrough_v3.28.0_CORE_frontend.md',
    'docs/walkthroughs/M01/walkthrough_v3.27.0_M01_backend.md',
  ]);
});

test('buildEntry agrupa por modulo y adjunta walkthroughs', () => {
  const entry = buildEntry({
    version: '3.29.0',
    date: '2026-09-23',
    level: 'minor',
    commits: [
      { sha: 'abc1234', subject: 'feat(M01): [0.1.0] agregar producto' },
      { sha: 'def5678', subject: 'fix(core): [0.0.1] ajustar layout' },
    ],
    walkthroughs: ['docs/walkthroughs/M01/walkthrough_v3.29.0_M01_backend.md'],
  });
  assert.match(entry, /^## \[v3\.29\.0\] - 2026-09-23/m);
  assert.match(entry, /### Modulo: M01/);
  assert.match(entry, /### Modulo: CORE/);
  assert.match(entry, /\[walkthroughs\/M01\/walkthrough_v3\.29\.0_M01_backend\.md\]\(\.\/walkthroughs\/M01\/walkthrough_v3\.29\.0_M01_backend\.md\)/);
});

test('upsertEntry inserta arriba y es idempotente', () => {
  const changelog = '# CHANGELOG\n\n## [v3.28.0] - 2026-09-13\n- previo\n';
  const entry = '## [v3.29.0] - 2026-09-23\n- nuevo\n';
  const first = upsertEntry(changelog, entry, '3.29.0');
  assert.equal(first.changed, true);
  assert.ok(first.changelog.indexOf('## [v3.29.0]') < first.changelog.indexOf('## [v3.28.0]'));
  const second = upsertEntry(first.changelog, entry, '3.29.0');
  assert.equal(second.changed, false);
  assert.equal(second.changelog, first.changelog);
  assert.ok(hasVersion(first.changelog, '3.29.0'));
});

test('parseScope extrae el modulo del commit convencional', () => {
  assert.equal(parseScope('feat(M01): [0.1.0] algo'), 'M01');
  assert.equal(parseScope('fix(core): [0.0.1] algo'), 'core');
  assert.equal(parseScope('docs: algo'), 'General');
});

test('compute calcula el bump desde el tag base y las marcas del commit', () => {
  const dir = createRepo();
  commitFile(dir, 'a.txt', 'a', 'first commit');
  gitRun(dir, 'tag', 'v3.12.4');
  commitFile(dir, 'b.txt', 'b', 'feat(M01): [0.1.0] agregar consulta publica');
  const output = runCli(dir, 'compute', '--json', '--from', '0000000000000000000000000000000000000000');
  const data = JSON.parse(output);
  assert.equal(data.has_bump, true);
  assert.equal(data.base_version, '3.12.4');
  assert.equal(data.new_version, '3.13.0');
  assert.equal(data.bump_level, 'minor');
  assert.equal(data.commits.length, 1);
});

test('compute no bumpea cuando no hay marcas [X.Y.Z]', () => {
  const dir = createRepo();
  commitFile(dir, 'a.txt', 'a', 'first commit');
  gitRun(dir, 'tag', 'v3.12.4');
  commitFile(dir, 'b.txt', 'b', 'docs: actualizar guia');
  const data = JSON.parse(runCli(dir, 'compute', '--json'));
  assert.equal(data.has_bump, false);
  assert.equal(data.new_version, null);
});

test('write-changelog crea la entrada, es idempotente y detecta walkthroughs', () => {
  const dir = createRepo();
  commitFile(dir, 'a.txt', 'a', 'first commit');
  gitRun(dir, 'tag', 'v3.12.4');
  mkdirSync(path.join(dir, 'docs'), { recursive: true });
  writeFileSync(path.join(dir, 'docs', 'CHANGELOG.md'), '# CHANGELOG\n\n## [v3.12.4] - 2026-01-01\n- previo\n', 'utf8');
  gitRun(dir, 'add', 'docs/CHANGELOG.md');
  gitRun(dir, 'commit', '-q', '-m', 'docs: changelog base');
  commitFile(dir, 'b.txt', 'b', 'feat(M01): [0.1.0] corregir filtro\n\nWalkthrough: docs/walkthroughs/M01/walkthrough_v3.13.0_M01_fix_backend.md');
  const output = runCli(dir, 'write-changelog', '--version', '3.13.0');
  assert.match(output, /CHANGELOG actualizado con v3\.13\.0/);
  const changelog = readFileSync(path.join(dir, 'docs', 'CHANGELOG.md'), 'utf8');
  assert.ok(changelog.indexOf('## [v3.13.0]') < changelog.indexOf('## [v3.12.4]'));
  assert.match(changelog, /walkthrough_v3\.13\.0_M01_fix_backend\.md/);
  const second = runCli(dir, 'write-changelog', '--version', '3.13.0');
  assert.match(second, /ya existe/);
  assert.equal(readFileSync(path.join(dir, 'docs', 'CHANGELOG.md'), 'utf8'), changelog);
});

test('check-pr exige la marca de version y falla con guia', () => {
  const dir = createRepo();
  commitFile(dir, 'a.txt', 'a', 'first commit');
  writeFileSync(path.join(dir, 'pr.txt'), 'feat(M01): [0.1.0] implementar catalogo\n', 'utf8');
  const ok = runCli(dir, 'check-pr', '--file', path.join(dir, 'pr.txt'));
  assert.match(ok, /OK: marca de version valida/);
  writeFileSync(path.join(dir, 'pr.txt'), 'feat(M01): implementar catalogo\n', 'utf8');
  assert.throws(() => runCli(dir, 'check-pr', '--file', path.join(dir, 'pr.txt')), /Command failed/);
});

test('formatVersion normaliza la salida', () => {
  assert.equal(formatVersion({ major: 3, minor: 12, patch: 4 }), '3.12.4');
});
