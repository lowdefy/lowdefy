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

// Packages that use React context for cross-component coordination (e.g., antd's
// CSS-in-JS StyleProvider/ConfigProvider, XProvider). These MUST resolve to a single
// instance across the isolated server and all linked @lowdefy/* packages. Without these
// overrides, pnpm installs a separate npm copy for the server while linked packages use
// the monorepo's copy — two instances = broken theming/dark mode.
const SINGLETON_PACKAGES = ['antd', '@ant-design/cssinjs', '@ant-design/x'];

function rewritePackageJson({ filePath, targetDir, packageMap, sourceDir }) {
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const overrides = {};

  for (const depType of ['dependencies', 'devDependencies']) {
    const deps = pkg[depType];
    if (!deps) continue;
    for (const [name] of Object.entries(deps)) {
      if (name.startsWith('@lowdefy/') && packageMap.has(name)) {
        const relPath = path.relative(targetDir, packageMap.get(name));
        deps[name] = `link:${relPath}`;
      }
    }
  }

  for (const [name, absDir] of packageMap) {
    const relPath = path.relative(targetDir, absDir);
    overrides[name] = `link:${relPath}`;
  }

  // Link singletons to the source server's install in the monorepo: pnpm resolves the
  // linked @lowdefy/* packages to that same instance. The monorepo root node_modules
  // does not hoist them, so it can't be the source.
  for (const name of SINGLETON_PACKAGES) {
    const pkgDir = path.join(sourceDir, 'node_modules', name);
    if (!fs.existsSync(pkgDir)) {
      throw new Error(`${name} is not installed in ${sourceDir}. Run pnpm install first.`);
    }
    overrides[name] = `link:${path.relative(targetDir, pkgDir)}`;
  }

  pkg.pnpm = pkg.pnpm ?? {};
  pkg.pnpm.overrides = overrides;

  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
}

function rewriteDeps({ sourceDir, targetDir, packageMap }) {
  rewritePackageJson({
    filePath: path.join(targetDir, 'package.json'),
    targetDir,
    packageMap,
    sourceDir,
  });
  rewritePackageJson({
    filePath: path.join(targetDir, 'package.original.json'),
    targetDir,
    packageMap,
    sourceDir,
  });
}

export default rewriteDeps;
