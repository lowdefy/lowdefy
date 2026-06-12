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

import { LineCounter, parseDocument, isMap, isSeq, isScalar, isAlias } from 'yaml';
import { ConfigError } from '@lowdefy/errors';

// Parses YAML source into a position-tagged IR:
//   { t: 'map', pos, entries: [{ key, keyPos, value }] }
//   { t: 'seq', pos, items: [node] }
//   { t: 'lit', pos, value }
// Aliases resolve to literals positioned at the alias site. Non-string map
// keys fall back to a literal subtree (positions at the map).
function parseYamlSource({ source, file }) {
  const lineCounter = new LineCounter();
  const doc = parseDocument(source, { lineCounter });

  if (doc.errors.length > 0) {
    const error = doc.errors[0];
    const { line } = lineCounter.linePos(error.pos?.[0] ?? 0);
    throw new ConfigError(`YAML parse error in "${file}": ${error.message}`, {
      filePath: file,
      lineNumber: line,
    });
  }

  function pos(node) {
    if (node?.range?.[0] === undefined) return { line: 1, col: 1 };
    const { line, col } = lineCounter.linePos(node.range[0]);
    return { line, col };
  }

  function toIr(node) {
    if (node === null || node === undefined) {
      return { t: 'lit', pos: { line: 1, col: 1 }, value: null };
    }
    if (isAlias(node)) {
      return { t: 'lit', pos: pos(node), value: node.resolve(doc)?.toJSON() ?? null };
    }
    if (isScalar(node)) {
      return { t: 'lit', pos: pos(node), value: node.value ?? null };
    }
    if (isSeq(node)) {
      return { t: 'seq', pos: pos(node), items: node.items.map((item) => toIr(item)) };
    }
    if (isMap(node)) {
      const entries = [];
      for (const pair of node.items) {
        if (!isScalar(pair.key) || typeof pair.key.value !== 'string') {
          // Non-string key — fall back to a literal subtree.
          return { t: 'lit', pos: pos(node), value: node.toJSON() };
        }
        entries.push({
          key: pair.key.value,
          keyPos: pos(pair.key),
          value: toIr(pair.value),
        });
      }
      return { t: 'map', pos: pos(node), entries };
    }
    // Unknown node type — literal fallback.
    return { t: 'lit', pos: pos(node), value: node.toJSON?.() ?? null };
  }

  if (doc.contents === null) {
    return { t: 'lit', pos: { line: 1, col: 1 }, value: null };
  }
  return toIr(doc.contents);
}

export default parseYamlSource;
