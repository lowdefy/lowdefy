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

import createNestedNpmrc from './createNestedNpmrc.js';

const parentNpmrcPath = '/repo/.npmrc';
const serverNpmrc = 'strict-peer-dependencies=false\n';

test('createNestedNpmrc copies the parent lines ahead of the server package lines', () => {
  const { content, skippedKeys } = createNestedNpmrc({
    parentNpmrc: '@scope:registry=https://npm.example.com/\n\n# a comment\nnode-linker=hoisted\n',
    parentNpmrcPath,
    serverNpmrc,
  });
  expect(content).toEqual(`# >>> Copied by Lowdefy from /repo/.npmrc; rewritten on every run.
@scope:registry=https://npm.example.com/
# a comment
node-linker=hoisted
# <<< End of the lines copied by Lowdefy.
strict-peer-dependencies=false
`);
  expect(skippedKeys).toEqual([]);
});

test('createNestedNpmrc replaces the lines a previous run copied', () => {
  const { content } = createNestedNpmrc({
    parentNpmrc: '@scope:registry=https://new.example.com/\n',
    parentNpmrcPath,
    serverNpmrc: `# >>> Copied by Lowdefy from /repo/.npmrc; rewritten on every run.
@scope:registry=https://old.example.com/
# <<< End of the lines copied by Lowdefy.
strict-peer-dependencies=false
`,
  });
  expect(content).toEqual(`# >>> Copied by Lowdefy from /repo/.npmrc; rewritten on every run.
@scope:registry=https://new.example.com/
# <<< End of the lines copied by Lowdefy.
strict-peer-dependencies=false
`);
});

test('createNestedNpmrc removes copied lines when the parent no longer has an .npmrc', () => {
  const { content } = createNestedNpmrc({
    parentNpmrc: null,
    parentNpmrcPath,
    serverNpmrc: `# >>> Copied by Lowdefy from /repo/.npmrc; rewritten on every run.
@scope:registry=https://old.example.com/
# <<< End of the lines copied by Lowdefy.
strict-peer-dependencies=false
`,
  });
  expect(content).toEqual(serverNpmrc);
});

test('createNestedNpmrc writes only the parent lines when the server has no .npmrc', () => {
  const { content } = createNestedNpmrc({
    parentNpmrc: '@scope:registry=https://npm.example.com/',
    parentNpmrcPath,
    serverNpmrc: null,
  });
  expect(content).toEqual(`# >>> Copied by Lowdefy from /repo/.npmrc; rewritten on every run.
@scope:registry=https://npm.example.com/
# <<< End of the lines copied by Lowdefy.
`);
});

test('createNestedNpmrc keeps credentials that reference environment variables', () => {
  const credentials = [
    '//npm.example.com/:_authToken=${NPM_TOKEN}',
    '//other.example.com/:_auth = "${OTHER_AUTH}"',
    '//third.example.com/:_password=${PASSWORD:-}',
    'https-proxy=http://user:${PROXY_PASSWORD}@proxy.example.com/',
  ];
  const { content, skippedKeys } = createNestedNpmrc({
    parentNpmrc: credentials.join('\n'),
    parentNpmrcPath,
    serverNpmrc: null,
  });
  expect(content).toEqual(
    [
      '# >>> Copied by Lowdefy from /repo/.npmrc; rewritten on every run.',
      ...credentials,
      '# <<< End of the lines copied by Lowdefy.',
      '',
    ].join('\n')
  );
  expect(skippedKeys).toEqual([]);
});

test('createNestedNpmrc does not copy credentials written out in the parent file', () => {
  const { content, skippedKeys } = createNestedNpmrc({
    parentNpmrc: [
      '@scope:registry=https://npm.example.com/',
      '//npm.example.com/:_authToken=npm_secret',
      '//npm.example.com/:_password=c2VjcmV0',
      '_auth=dXNlcjpzZWNyZXQ=',
      'key="-----BEGIN PRIVATE KEY-----"',
      'proxy=http://user:secret@proxy.example.com/',
      '//npm.example.com/:username=user',
    ].join('\n'),
    parentNpmrcPath,
    serverNpmrc,
  });
  expect(content).toEqual(`# >>> Copied by Lowdefy from /repo/.npmrc; rewritten on every run.
@scope:registry=https://npm.example.com/
//npm.example.com/:username=user
# <<< End of the lines copied by Lowdefy.
strict-peer-dependencies=false
`);
  expect(skippedKeys).toEqual([
    '//npm.example.com/:_authToken',
    '//npm.example.com/:_password',
    '_auth',
    'key',
    'proxy',
  ]);
});

test('createNestedNpmrc does not copy credentials hidden in an environment variable fallback', () => {
  const { content, skippedKeys } = createNestedNpmrc({
    parentNpmrc: [
      '//npm.example.com/:_authToken=${NPM_TOKEN:-npm_secret}',
      '//other.example.com/:_authToken=${NPM_TOKEN-npm_secret}',
      'proxy=http://user:${PROXY_PASSWORD:-secret}@proxy.example.com/',
    ].join('\n'),
    parentNpmrcPath,
    serverNpmrc,
  });
  expect(content).not.toContain('secret');
  expect(skippedKeys).toEqual([
    '//npm.example.com/:_authToken',
    '//other.example.com/:_authToken',
    'proxy',
  ]);
});

test('createNestedNpmrc does not copy credentials under quoted or differently cased keys', () => {
  const { content, skippedKeys } = createNestedNpmrc({
    parentNpmrc: [
      '"//npm.example.com/:_authToken" = npm_secret',
      "'_auth'=c2VjcmV0",
      '//npm.example.com/:_AuthToken=npm_secret',
    ].join('\n'),
    parentNpmrcPath,
    serverNpmrc,
  });
  expect(content).not.toContain('secret');
  expect(skippedKeys).toEqual([
    '//npm.example.com/:_authToken',
    '_auth',
    '//npm.example.com/:_AuthToken',
  ]);
});

test('createNestedNpmrc does not copy or report a password written in the key', () => {
  const { content, skippedKeys } = createNestedNpmrc({
    parentNpmrc: '//user:secret@npm.example.com/:_authToken=${NPM_TOKEN}',
    parentNpmrcPath,
    serverNpmrc,
  });
  expect(content).not.toContain('secret');
  expect(skippedKeys).toEqual(['//***@npm.example.com/:_authToken']);
});
