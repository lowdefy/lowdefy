// LDF-1164 probe: per-journey cost of the dev host's secret-name scan (LDF-1159) and client map check (LDF-1158).
import fs from 'node:fs';
import path from 'node:path';
const L = '/Users/puffin/.puffin/work/51839/lowdefy-ldf1164';
const buildDirectory = `${L}/_server/dev-ldf1164/build`;
const { readBuildSecretNames } = await import(`${L}/packages/utils/test-utils/dist/secrets/index.js`);
const files = fs.readdirSync(buildDirectory, { recursive: true }).filter((f) => f.endsWith('.json'));
console.log('json files', files.length);
const cache = new Map();
let s = performance.now(); readBuildSecretNames({ directories: { build: buildDirectory }, cache }); console.log('first scan (cold cache)', (performance.now() - s).toFixed(1), 'ms');
s = performance.now(); for (let i = 0; i < 20; i++) readBuildSecretNames({ directories: { build: buildDirectory }, cache }); console.log('warm scan', ((performance.now() - s) / 20).toFixed(1), 'ms each');
const jsMap = path.join(buildDirectory, 'plugins', 'operators', 'clientJsMap.js');
s = performance.now(); for (let i = 0; i < 1000; i++) fs.statSync(jsMap); console.log('clientJsMap stat', ((performance.now() - s) / 1000).toFixed(3), 'ms each');
const size = fs.statSync(jsMap).size; s = performance.now(); fs.readFileSync(jsMap, 'utf8'); console.log('clientJsMap read', (performance.now() - s).toFixed(1), 'ms, size', size);
