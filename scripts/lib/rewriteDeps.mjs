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
import { createRequire } from 'node:module';

// Packages that use React context for cross-component coordination (e.g., antd's
// CSS-in-JS StyleProvider/ConfigProvider). These MUST resolve to a single instance
// across the isolated dev server and all linked @lowdefy/* packages. Without these
// overrides, pnpm installs a separate npm copy for the dev server while linked
// packages use the monorepo's copy — two instances = broken theming/dark mode
// (every component falls back to antd's default tokens under `css-var-root`).
const SINGLETON_PACKAGES = ['antd', '@ant-design/x', '@ant-design/cssinjs'];

// The singletons are not dependencies of the workspace root, so
// <repoRoot>/node_modules/<name> usually does not exist. Resolve them the way
// the linked plugin packages do — via the workspace packages that import them —
// so the server links to the exact instance the blocks use.
const SINGLETON_CONSUMERS = [
  'packages/plugins/blocks/blocks-antd',
  'packages/plugins/blocks/blocks-antd-x',
  'packages/client',
];

function resolveSingletonDirs(repoRoot) {
  const resolved = {};
  for (const name of SINGLETON_PACKAGES) {
    const rootDir = path.join(repoRoot, 'node_modules', name);
    if (fs.existsSync(rootDir)) {
      resolved[name] = rootDir;
      continue;
    }
    // Already-resolved singletons also act as consumers: @ant-design/cssinjs is
    // nobody's direct workspace dependency, but it must be antd's own copy.
    const consumerDirs = [
      ...SINGLETON_CONSUMERS.map((consumer) => path.join(repoRoot, consumer)),
      ...Object.values(resolved),
    ];
    for (const dir of consumerDirs) {
      try {
        const consumerRequire = createRequire(path.join(dir, 'package.json'));
        resolved[name] = path.dirname(consumerRequire.resolve(`${name}/package.json`));
        break;
      } catch {
        // not a dependency of this consumer — try the next one
      }
    }
  }
  return resolved;
}

function rewritePackageJson({ filePath, targetDir, packageMap, repoRoot }) {
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

  // Force singleton packages to resolve to the monorepo's instance.
  const singletonDirs = resolveSingletonDirs(repoRoot);
  for (const name of SINGLETON_PACKAGES) {
    const pkgDir = singletonDirs[name];
    if (pkgDir) {
      const relPath = path.relative(targetDir, pkgDir);
      overrides[name] = `link:${relPath}`;
    } else {
      console.warn(`rewriteDeps: could not resolve singleton package "${name}" — theming may break.`);
    }
  }

  pkg.pnpm = pkg.pnpm ?? {};
  pkg.pnpm.overrides = overrides;

  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
}

function rewriteDeps({ targetDir, packageMap, repoRoot }) {
  rewritePackageJson({
    filePath: path.join(targetDir, 'package.json'),
    targetDir,
    packageMap,
    repoRoot,
  });
  rewritePackageJson({
    filePath: path.join(targetDir, 'package.original.json'),
    targetDir,
    packageMap,
    repoRoot,
  });
}

export default rewriteDeps;
