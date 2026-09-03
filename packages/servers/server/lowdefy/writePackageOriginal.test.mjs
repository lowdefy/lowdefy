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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { resolveWorkspaceVersions } from './writePackageOriginal.mjs';

test('workspace ranges resolve to the fixed workspace version', () => {
  const pkg = {
    version: '5.6.0',
    dependencies: {
      '@lowdefy/docs': 'workspace:*',
      '@lowdefy/api': 'workspace:^',
      '@lowdefy/build': 'workspace:~',
      '@lowdefy/engine': 'workspace:5.5.1',
      hono: '4.9.0',
    },
    devDependencies: {
      '@lowdefy/errors': 'workspace:*',
    },
  };
  const resolved = resolveWorkspaceVersions(pkg);
  expect(resolved.dependencies).toEqual({
    '@lowdefy/docs': '5.6.0',
    '@lowdefy/api': '^5.6.0',
    '@lowdefy/build': '~5.6.0',
    '@lowdefy/engine': '5.5.1',
    hono: '4.9.0',
  });
  expect(resolved.devDependencies).toEqual({ '@lowdefy/errors': '5.6.0' });
  // The input is never mutated.
  expect(pkg.dependencies['@lowdefy/docs']).toEqual('workspace:*');
});

test('no workspace range in this package survives into package.original.json', () => {
  const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
  const resolved = resolveWorkspaceVersions(pkg);
  const ranges = Object.values({
    ...resolved.dependencies,
    ...resolved.devDependencies,
    ...resolved.optionalDependencies,
    ...resolved.peerDependencies,
  });
  expect(ranges.some((range) => range.startsWith('workspace:'))).toBe(false);
});
