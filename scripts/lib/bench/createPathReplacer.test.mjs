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
import { test } from 'node:test';

import createPathReplacer from './createPathReplacer.mjs';

const replace = createPathReplacer({
  directory: '/repo/_server/bench/app/baseline',
  placeholder: '<server>',
});

test('createPathReplacer replaces the server directory and keeps the path after it', () => {
  assert.equal(
    replace('{"file":"/repo/_server/bench/app/baseline/build/plugins/blocks.js"}'),
    '{"file":"<server>/build/plugins/blocks.js"}'
  );
});

test('createPathReplacer replaces every occurrence and leaves other paths alone', () => {
  assert.equal(
    replace(
      '/repo/_server/bench/app/baseline and /repo/packages/api and /repo/_server/bench/app/baseline/x'
    ),
    '<server> and /repo/packages/api and <server>/x'
  );
});

test('createPathReplacer stops a path at a quote, whitespace or colon', () => {
  assert.equal(
    replace("'/repo/_server/bench/app/baseline/a.yaml:12' /repo/_server/bench/app/baseline/b c"),
    "'<server>/a.yaml:12' <server>/b c"
  );
});

test('createPathReplacer escapes regular expression characters in the directory', () => {
  const replaceDotted = createPathReplacer({ directory: '/a.b/(c)', placeholder: '<server>' });
  assert.equal(replaceDotted('/a.b/(c)/x /aXb/(c)/x'), '<server>/x /aXb/(c)/x');
});
