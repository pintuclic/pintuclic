import test from 'node:test';
import assert from 'node:assert/strict';

import {
  changelogHasVersion,
  classifyStep,
  nextVersions,
  parseTitle,
  parseVersion,
  releaseNotes,
  validateChangelogEntry,
  validateInput,
  ZERO_VERSION,
} from './versioning.mjs';

test('parseVersion acepta X.Y.Z.W y rechaza formatos invalidos', () => {
  assert.deepEqual(parseVersion('0.4.7.3'), [0, 4, 7, 3]);
  assert.deepEqual(parseVersion(' 12.34.5.6 '), [12, 34, 5, 6]);
  assert.equal(parseVersion('0.4.7'), null);
  assert.equal(parseVersion('0.4.7.3.1'), null);
  assert.equal(parseVersion('v0.4.7.3'), null);
  assert.equal(parseVersion('01.4.7.3'), null);
  assert.equal(parseVersion(''), null);
  assert.equal(parseVersion(null), null);
});

test('nextVersions cubre las cuatro filas de la tabla desde 0.4.7.3', () => {
  assert.deepEqual(nextVersions('0.4.7.3'), {
    mayor: '1.0.0.0',
    'minior-estable': '0.5.0.0',
    'minior-feat': '0.4.8.0',
    patch: '0.4.7.4',
  });
  assert.deepEqual(nextVersions(ZERO_VERSION), {
    mayor: '1.0.0.0',
    'minior-estable': '0.1.0.0',
    'minior-feat': '0.0.1.0',
    patch: '0.0.0.1',
  });
});

test('classifyStep solo acepta el siguiente paso exacto de la tabla', () => {
  assert.equal(classifyStep('0.4.7.3', '1.0.0.0'), 'mayor');
  assert.equal(classifyStep('0.4.7.3', '0.5.0.0'), 'minior-estable');
  assert.equal(classifyStep('0.4.7.3', '0.4.8.0'), 'minior-feat');
  assert.equal(classifyStep('0.4.7.3', '0.4.7.4'), 'patch');
  assert.equal(classifyStep('0.4.7.3', '0.4.9.0'), null, 'no se permiten saltos');
  assert.equal(classifyStep('0.4.7.3', '0.4.8.1'), null, 'no se permiten dos segmentos a la vez');
  assert.equal(classifyStep('0.4.7.3', '0.4.7.3'), null, 'la version no puede repetirse');
  assert.equal(classifyStep('0.4.7.3', '0.4.7.2'), null, 'la version no puede bajar');
  assert.equal(classifyStep('0.4.7.3', '5.0.0.0'), null, 'mayor debe ser exactamente la siguiente');
});

test('parseTitle acepta el formato tipo(scope) [X.Y.Z.W]: mensaje', () => {
  const withScope = parseTitle('feat(carrito) [0.4.8.0]: agregar panel lateral');
  assert.equal(withScope.ok, true);
  assert.deepEqual(withScope.value, {
    type: 'feat',
    scope: 'carrito',
    version: '0.4.8.0',
    message: 'agregar panel lateral',
  });

  const withoutScope = parseTitle('fix [0.4.7.4]: corregir borde del modal');
  assert.equal(withoutScope.ok, true);
  assert.equal(withoutScope.value.scope, null);
  assert.equal(withoutScope.value.version, '0.4.7.4');

  const withPrefix = parseTitle('chore(core) [v0.4.7.4]: limpiar scripts');
  assert.equal(withPrefix.ok, true);
  assert.equal(withPrefix.value.version, '0.4.7.4');

  const withInnerColon = parseTitle('fix(core) [0.4.7.4]: corregir: caso borde');
  assert.equal(withInnerColon.ok, true);
  assert.equal(withInnerColon.value.message, 'corregir: caso borde');
});

test('parseTitle rechaza titulos fuera de la convencion', () => {
  const invalid = [
    'M05 Panel lateral "Tu carrito" al agregar productos — v0.4.7.0 (#1052)',
    'feat(carrito) [0.4.8]: agregar panel lateral',
    'feat(carrito) 0.4.8.0: agregar panel lateral',
    'feat: agregar panel lateral',
    'feat(carrito) [0.4.8.0]: ',
    'feat(carrito) [01.4.8.0]: agregar panel lateral',
    '',
  ];
  for (const title of invalid) {
    const result = parseTitle(title);
    assert.equal(result.ok, false, `deberia fallar: "${title}"`);
    assert.ok(result.error.length > 0);
  }
});

test('changelogHasVersion detecta la entrada exacta', () => {
  const content = '# Changelog\n\n## [v0.4.8.0] - 2026-10-14\n### Core\n';
  assert.equal(changelogHasVersion('0.4.8.0', content), true);
  assert.equal(changelogHasVersion('0.4.7.4', content), false);
  assert.equal(changelogHasVersion('0.4.8.0', ''), false);
});

test('validateChangelogEntry exige encabezado con fecha real y autor con @usuario', () => {
  const valid = '## [v0.4.8.0] - 2026-10-14\n- **Autor:** Mapachuelo (@Mapachuelo)\n### Core\n';
  assert.deepEqual(validateChangelogEntry('0.4.8.0', valid), { ok: true, errors: [] });

  const withoutAuthor = '## [v0.4.8.0] - 2026-10-14\n### Core\n';
  const authorErrors = validateChangelogEntry('0.4.8.0', withoutAuthor);
  assert.equal(authorErrors.ok, false);
  assert.ok(authorErrors.errors.some((error) => error.includes('Autor')));

  const invalidDate = '## [v0.4.8.0] - 14/10/2026\n- **Autor:** Mapachuelo (@Mapachuelo)\n';
  const dateErrors = validateChangelogEntry('0.4.8.0', invalidDate);
  assert.equal(dateErrors.ok, false);
  assert.ok(dateErrors.errors.some((error) => error.includes('AAAA-MM-DD')));

  const authorWithoutHandle = '## [v0.4.8.0] - 2026-10-14\n- **Autor:** Mapachuelo\n';
  assert.equal(validateChangelogEntry('0.4.8.0', authorWithoutHandle).ok, false);

  const missingEntry = validateChangelogEntry('0.4.8.0', '## [v0.4.7.3] - 2026-10-10\n');
  assert.equal(missingEntry.ok, false);
  assert.ok(missingEntry.errors.some((error) => error.includes('v0.4.8.0')));
});

test('validateInput acepta una PR coherente', () => {
  const result = validateInput({
    title: 'feat(core) [0.4.8.0]: versionado automatico por PRs',
    base: '0.4.7.3',
    fileVersion: '0.4.8.0',
    changelogContent: '## [v0.4.8.0] - 2026-10-14\n- **Autor:** Mapachuelo (@Mapachuelo)\n',
  });
  assert.equal(result.ok, true);
  assert.equal(result.row, 'minior-feat');
  assert.equal(result.version, '0.4.8.0');
});

test('validateInput rechaza saltos, desajustes y changelog ausente', () => {
  const jump = validateInput({
    title: 'feat(core) [0.4.9.0]: salto invalido',
    base: '0.4.7.3',
    fileVersion: '0.4.9.0',
    changelogContent: '## [v0.4.9.0] - 2026-10-14\n- **Autor:** Mapachuelo (@Mapachuelo)\n',
  });
  assert.equal(jump.ok, false);
  assert.ok(jump.errors.some((error) => error.includes('siguiente paso')));

  const mismatch = validateInput({
    title: 'feat(core) [0.4.8.0]: archivo desajustado',
    base: '0.4.7.3',
    fileVersion: '0.4.7.3',
    changelogContent: '## [v0.4.8.0] - 2026-10-14\n- **Autor:** Mapachuelo (@Mapachuelo)\n',
  });
  assert.equal(mismatch.ok, false);
  assert.ok(mismatch.errors.some((error) => error.includes('version.txt')));

  const missingChangelog = validateInput({
    title: 'feat(core) [0.4.8.0]: changelog ausente',
    base: '0.4.7.3',
    fileVersion: '0.4.8.0',
    changelogContent: '# sin entradas\n',
  });
  assert.equal(missingChangelog.ok, false);
  assert.ok(missingChangelog.errors.some((error) => error.includes('CHANGELOG')));

  const oldStyle = validateInput({
    title: 'Feature/m01 dashboard catalogo',
    base: '0.4.7.3',
    fileVersion: '0.4.7.3',
    changelogContent: '',
  });
  assert.equal(oldStyle.ok, false);
});

test('validateInput permite omitir el changelog cuando se pasa null', () => {
  const result = validateInput({
    title: 'fix(core) [0.4.7.4]: corregir caso borde',
    base: '0.4.7.3',
    fileVersion: '0.4.7.4',
    changelogContent: null,
  });
  assert.equal(result.ok, true);
  assert.equal(result.row, 'patch');
});

test('releaseNotes lista cada PR una sola vez y sin commits', () => {
  const notes = releaseNotes({
    branch: 'develop',
    prs: [{ number: 1055, title: 'feat(core) [0.4.8.0]: versionado automatico', login: 'Mapachuelo' }],
  });
  assert.ok(notes.includes('Canal: develop (pre-release)'));
  assert.ok(notes.includes('- #1055 feat(core) [0.4.8.0]: versionado automatico — por @Mapachuelo'));
  assert.equal((notes.match(/#1055/g) || []).length, 1);
  assert.ok(!/^- [0-9a-f]{7,} /m.test(notes), 'no debe listar commits');

  const manual = releaseNotes({ branch: 'main', manual: true });
  assert.ok(manual.includes('Canal: main (estable)'));
  assert.ok(manual.includes('Ejecucion manual'));
});
