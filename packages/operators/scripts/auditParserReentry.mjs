/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// P6.2 — the permanent-walker audit. Lists every operator that re-enters
// evaluation on a subtree the build never saw, so it can never be replaced by a
// compiled closure (R23: the walker and the closures coexist by decision).
//
//   node packages/operators/scripts/auditParserReentry.mjs [--json]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../plugins/operators');

// Categories, most severe first. Only `walker` operators can never be replaced
// by a compiled closure; the rest compile but constrain what compilation buys.
const CATEGORIES = ['walker', 'dispatch', 'opaque', 'dependent'];

const RULES = [
  {
    id: 'parser-reentry',
    category: 'walker',
    reason: 'Calls parser.parse on a subtree it builds at runtime.',
    test: (source) => /\bparser\.parse\s*\(/.test(source),
  },
  {
    id: 'returns-function',
    category: 'walker',
    reason: 'Returns a function the engine calls later with runtime arguments.',
    test: (source) => /return\s*\((\.\.\.)?\w*\)\s*=>/.test(source),
  },
  {
    id: 'operator-dispatch',
    category: 'dispatch',
    reason: 'Selects an operator by a name only known at runtime.',
    test: (source) => /\boperators\s*\[/.test(source),
  },
  {
    id: 'operator-callback',
    category: 'dispatch',
    reason: 'Hands other operators to runtime code as callbacks.',
    test: (source) => /\boperators\.\w+\s*\(/.test(source),
  },
  {
    id: 'runtime-language',
    category: 'opaque',
    reason: 'Evaluates a template or query language over runtime data.',
    test: (source) => /\bnunjucks\b|\bjsonata\b|\byaml\.|\bmql\b|jsMap\[/.test(source),
  },
  {
    id: 'callback-param',
    category: 'dependent',
    reason: 'Takes a callback built by _function, whose body the walker parses at call time.',
    test: (source) => /'callback'/.test(source),
  },
];

function listSourceFiles(directory, files = []) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(entryPath, files);
      return;
    }
    if (!entry.name.endsWith('.js')) return;
    if (entry.name.endsWith('.test.js')) return;
    if (entry.name === 'index.js' || entry.name === '_index.js') return;
    files.push(entryPath);
  });
  return files;
}

function audit() {
  const findings = [];
  fs.readdirSync(root)
    .sort()
    .forEach((pkg) => {
      const sourceRoot = path.join(root, pkg, 'src', 'operators');
      if (!fs.existsSync(sourceRoot)) return;
      listSourceFiles(sourceRoot).forEach((file) => {
        const source = fs.readFileSync(file, 'utf8');
        const reasons = RULES.filter(({ test }) => test(source)).map(
          ({ category, id, reason }) => ({ category, id, reason })
        );
        if (reasons.length === 0) return;
        findings.push({
          package: `@lowdefy/operators-${pkg.replace(/^operators-/, '')}`,
          kind: path.basename(path.dirname(file)),
          operator: `_${path.basename(file, '.js').replace(/^_/, '')}`,
          file: path.relative(path.join(root, '../../..'), file),
          category: CATEGORIES.find((category) =>
            reasons.some((entry) => entry.category === category)
          ),
          reasons,
        });
      });
    });
  return findings;
}

const findings = audit();

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(findings, null, 2)}\n`);
} else {
  CATEGORIES.forEach((category) => {
    const inCategory = findings.filter((finding) => finding.category === category);
    process.stdout.write(`${category}: ${inCategory.length}\n`);
  });
  process.stdout.write('\n');
  findings.forEach(({ operator, kind, package: pkg, file, category, reasons }) => {
    process.stdout.write(`${operator} (${pkg}, ${kind}) — ${category}\n  ${file}\n`);
    reasons.forEach(({ id, reason }) => process.stdout.write(`  - [${id}] ${reason}\n`));
    process.stdout.write('\n');
  });
}
