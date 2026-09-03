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

// package.original.json is what the CLI's resetServerPackageJson restores over
// a consuming app's generated server. pnpm rewrites workspace: protocols only
// in the published tarball's package.json, AFTER prepublishOnly has run - so a
// plain `cp package.json package.original.json` ships workspace: ranges no
// registry can resolve, and every `lowdefy build` in a consumer breaks. This
// writes the copy with workspace: ranges resolved instead. The workspace is a
// fixed version group (.changeset/config.json), so every @lowdefy sibling
// publishes at this package's own version.
export function resolveWorkspaceVersions(pkg) {
  const resolved = JSON.parse(JSON.stringify(pkg));
  const depKeys = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
  for (const depKey of depKeys) {
    for (const [name, range] of Object.entries(resolved[depKey] ?? {})) {
      if (!range.startsWith('workspace:')) continue;
      const inner = range.slice('workspace:'.length);
      if (inner === '*') {
        resolved[depKey][name] = pkg.version;
      } else if (inner === '^' || inner === '~') {
        resolved[depKey][name] = `${inner}${pkg.version}`;
      } else {
        resolved[depKey][name] = inner;
      }
    }
  }
  return resolved;
}

function writePackageOriginal() {
  const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
  fs.writeFileSync(
    path.join(packageDir, 'package.original.json'),
    `${JSON.stringify(resolveWorkspaceVersions(pkg), null, 2)}\n`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writePackageOriginal();
}
