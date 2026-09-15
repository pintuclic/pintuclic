import { readFileSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const { version } = JSON.parse(read('frontend/package.json'));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Versión SemVer inválida.');
const lock = JSON.parse(read('frontend/package-lock.json'));
if (lock.version !== version || lock.packages[''].version !== version) throw new Error('Versiones de package.json y lock desalineadas.');
const changelog = read('docs/CHANGELOG.md');
const headings = [...changelog.matchAll(/^## \[v([^\]]+)\]/gm)];
if (headings[0]?.[1] !== version) throw new Error('La primera entrada del changelog no coincide con el paquete.');
const notes = changelog.slice(headings[0].index, headings[1]?.index ?? changelog.length);
const walkthrough = notes.match(/\]\(\.\/(walkthroughs\/M\d+\/walkthrough_v[^)]+_frontend\.md)\)/)?.[1];
if (!walkthrough || !walkthrough.includes(`walkthrough_v${version}_`) || !existsSync(new URL(`docs/${walkthrough}`, root))) throw new Error('Falta el walkthrough frontend de esta versión.');
console.log(`Versión verificada: v${version}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\ntag=v${version}\n`);
if (process.argv.includes('--notes')) writeFileSync(fileURLToPath(new URL('RELEASE_NOTES.md', root)), notes);
