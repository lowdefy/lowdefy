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

import { expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The core is shared by the web and native renderers, so it reaches no
// browser global and pulls in no web renderer package.

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageDirectory = path.dirname(sourceDirectory);
const webOnlyPackage = /^(react-dom|antd|@ant-design\/.*|lucide-react)$/;

function listSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'test' ? [] : listSourceFiles(entryPath);
    }
    return entry.name.endsWith('.js') && !entry.name.endsWith('.test.js') ? [entryPath] : [];
  });
}

// Comments and string literals may name window and document; code may not.
function stripCommentsAndStrings(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/\/\/.*$/gm, '');
}

function readDependencies(packageJson) {
  return Object.keys({ ...packageJson.dependencies, ...packageJson.peerDependencies });
}

// Every package the core installs with, following the Lowdefy packages it depends on.
function listInstalledDependencies(directory, seen = new Set()) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  readDependencies(packageJson).forEach((name) => {
    if (seen.has(name)) return;
    seen.add(name);
    if (name.startsWith('@lowdefy/')) {
      listInstalledDependencies(fs.realpathSync(path.join(directory, 'node_modules', name)), seen);
    }
  });
  return seen;
}

test('client-core source reads no bare window or document', () => {
  const offenders = listSourceFiles(sourceDirectory).flatMap((filePath) => {
    const code = stripCommentsAndStrings(fs.readFileSync(filePath, 'utf8'));
    const matches = code.match(/(?<![.\w$])(window|document)(?![\w$])/g) ?? [];
    return matches.map((name) => `${path.relative(sourceDirectory, filePath)}: ${name}`);
  });
  expect(offenders).toEqual([]);
});

test('client-core depends on no web renderer package, directly or through a Lowdefy package', () => {
  const webOnly = [...listInstalledDependencies(packageDirectory)].filter((name) =>
    webOnlyPackage.test(name)
  );
  expect(webOnly).toEqual([]);
});

test('the source check finds a bare window or document', () => {
  const code = stripCommentsAndStrings(
    "// window\nconst a = 'window';\nconst b = globals.window;\nconst c = window.location;\ntypeof document;"
  );
  expect(code.match(/(?<![.\w$])(window|document)(?![\w$])/g)).toEqual(['window', 'document']);
});
