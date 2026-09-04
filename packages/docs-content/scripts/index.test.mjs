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

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'index.json'), 'utf8'));

test('index.json lists at least one doc for every documented section', () => {
  assert.ok(index.docs.length > 0, 'index.json lists no docs');
  const sections = new Set(index.docs.map((doc) => doc.section));
  for (const section of ['Concepts', 'Controls', 'Operators', 'Actions', 'Testing']) {
    assert.ok(sections.has(section), `index.json has no docs in section "${section}"`);
  }
});

test('every doc slug the MCP surfaces has a content file with prose under its title', () => {
  const empty = [];
  for (const doc of index.docs) {
    const filePath = path.join(packageDirectory, doc.path);
    if (!fs.existsSync(filePath)) {
      empty.push(`${doc.slug} (no file at ${doc.path})`);
      continue;
    }
    const markdown = fs.readFileSync(filePath, 'utf8');
    const body = markdown.replace(/^#[^\n]*\n/, '').trim();
    if (body === '') {
      empty.push(`${doc.slug} (title only)`);
    }
  }
  assert.deepEqual(empty, [], `Docs with no readable content: ${empty.join(', ')}`);
});

test('every extracted content file is reachable through index.json', () => {
  const indexed = new Set(index.docs.map((doc) => doc.path));
  const contentDirectory = path.join(packageDirectory, 'content');
  const orphans = fs
    .readdirSync(contentDirectory, { recursive: true })
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => `content/${entry.split(path.sep).join('/')}`)
    .filter((filePath) => !indexed.has(filePath));
  assert.deepEqual(orphans, [], `Content files missing from index.json: ${orphans.join(', ')}`);
});

test('control docs carry the control kind so they do not resolve as blocks', () => {
  const controls = index.docs.filter((doc) => doc.section === 'Controls');
  assert.ok(controls.length > 0, 'index.json has no control docs');
  for (const doc of controls) {
    assert.equal(doc.kind, 'control', `${doc.slug} has kind ${JSON.stringify(doc.kind)}`);
  }
});
