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

import fs from 'node:fs';
import path from 'node:path';

const CANDIDATE_SUFFIXES = ['.js', '.jsx', '.mjs', '.cjs', '/index.js', '/index.jsx', '/index.mjs'];

function isRelative(specifier) {
  return /^\.{1,2}(\/|$)/.test(specifier);
}

function hasExtension(specifier) {
  const pathPart = specifier.split('?')[0];
  const basename = pathPart.split('/').pop();
  return /\.[a-z0-9]+$/i.test(basename);
}

function findCompletions({ filename, specifier }) {
  const resolved = path.resolve(path.dirname(filename), specifier);
  return CANDIDATE_SUFFIXES.filter((suffix) => fs.existsSync(resolved + suffix)).map(
    (suffix) => specifier.replace(/\/$/, '') + suffix
  );
}

// Node's ES module loader does not add extensions or find index files, so an extensionless
// relative import works under a bundler or vitest and then fails in the published package.
const relativeImportExtension = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require a file extension on relative imports and exports.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      missing:
        'Relative import "{{ specifier }}" has no file extension, which Node ES modules require. Import "{{ completion }}" instead.',
      missingUnknown:
        'Relative import "{{ specifier }}" has no file extension, which Node ES modules require. Write the full file name, for example "{{ specifier }}.js" or "{{ specifier }}/index.js".',
    },
  },
  create(context) {
    function check(source) {
      if (source?.type !== 'Literal' || typeof source.value !== 'string') return;
      const specifier = source.value;
      if (!isRelative(specifier) || hasExtension(specifier)) return;
      const completions = findCompletions({ filename: context.filename, specifier });
      if (completions.length !== 1) {
        context.report({ node: source, messageId: 'missingUnknown', data: { specifier } });
        return;
      }
      const [completion] = completions;
      context.report({
        node: source,
        messageId: 'missing',
        data: { specifier, completion },
        fix: (fixer) => fixer.replaceText(source, `${source.raw[0]}${completion}${source.raw[0]}`),
      });
    }
    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
      ImportExpression: (node) => check(node.source),
    };
  },
};

export default relativeImportExtension;
