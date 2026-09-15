import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function fixture(version = '2.2.6', lockVersion = version) {
  const root = mkdtempSync(join(tmpdir(), 'pintuclic-release-'));
  for (const dir of ['.github/scripts', 'frontend', 'docs/walkthroughs/M17']) mkdirSync(join(root, dir), { recursive: true });
  copyFileSync(new URL('./check-release.mjs', import.meta.url), join(root, '.github/scripts/check-release.mjs'));
  writeFileSync(join(root, 'frontend/package.json'), JSON.stringify({ version }));
  writeFileSync(join(root, 'frontend/package-lock.json'), JSON.stringify({ version: lockVersion, packages: { '': { version: lockVersion } } }));
  const walkthrough = `walkthrough_v${version}_M17_entrega_frontend.md`;
  writeFileSync(join(root, 'docs/walkthroughs/M17', walkthrough), '# Entrega');
  writeFileSync(join(root, 'docs/CHANGELOG.md'), `# Cambios\n\n## [v${version}] - 2026-09-14\n\n- [Walkthrough](./walkthroughs/M17/${walkthrough})\n\n## [v2.2.5] - 2026-09-14\nAnterior\n`);
  return root;
}
function run(root) {
  const env = { ...process.env };
  delete env.GITHUB_OUTPUT;
  return spawnSync(process.execPath, [join(root, '.github/scripts/check-release.mjs'), '--notes'], { encoding: 'utf8', env });
}
test('release usa versión explícita y notas de su entrada, sin inventar incremento', () => {
  const root = fixture();
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  const notes = readFileSync(join(root, 'RELEASE_NOTES.md'), 'utf8');
  assert.match(notes, /v2\.2\.6/);
  assert.doesNotMatch(notes, /Anterior/);
});
test('release rechaza lockfile desalineado', () => {
  const result = run(fixture('2.2.6', '2.2.5'));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /desalineadas/);
});
test('release rechaza versión no coincidente con el changelog', () => {
  const root = fixture();
  writeFileSync(join(root, 'docs/CHANGELOG.md'), '## [v2.2.5] - 2026-09-14\n');
  assert.notEqual(run(root).status, 0);
});
test('release rechaza entrega sin walkthrough', () => {
  const root = fixture();
  writeFileSync(join(root, 'docs/CHANGELOG.md'), '## [v2.2.6] - 2026-09-14\nSin documento\n');
  assert.notEqual(run(root).status, 0);
});
