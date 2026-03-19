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

function readLowdefyYaml(configDirectory) {
  for (const filename of ['lowdefy.yaml', 'lowdefy.yml']) {
    const filePath = path.join(configDirectory, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  }
  return null;
}

function findPnpmWorkspaceRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function findWorkspacePackage(workspaceRoot, packageName) {
  function scan(dir, depth) {
    if (depth > 4) return null;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return null;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      const entryPath = path.join(dir, entry.name);
      const pkgJsonPath = path.join(entryPath, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
          if (pkg.name === packageName) return entryPath;
        } catch {
          // skip
        }
      }
      const found = scan(entryPath, depth + 1);
      if (found) return found;
    }
    return null;
  }
  return scan(workspaceRoot, 0);
}

function stripYamlQuotes(value) {
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function addPlugins({ configDirectory, targetDir, logger }) {
  const yamlContent = readLowdefyYaml(configDirectory);
  if (!yamlContent) return;

  const pluginRegex = /^plugins:\s*\n((?:[ \t]+.*\n)*)/m;
  const match = yamlContent.match(pluginRegex);
  if (!match) return;

  const pluginBlock = match[1];
  const plugins = [];
  let currentPlugin = null;

  for (const line of pluginBlock.split('\n')) {
    const nameMatch = line.match(/^\s+-\s+name:\s*(.+)/);
    const versionMatch = line.match(/^\s+version:\s*(.+)/);
    if (nameMatch) {
      if (currentPlugin) plugins.push(currentPlugin);
      currentPlugin = { name: stripYamlQuotes(nameMatch[1].trim()) };
    } else if (versionMatch && currentPlugin) {
      currentPlugin.version = stripYamlQuotes(versionMatch[1].trim());
    }
  }
  if (currentPlugin) plugins.push(currentPlugin);

  if (plugins.length === 0) return;

  logger.info(`Found ${plugins.length} custom plugin(s) in lowdefy.yaml`);

  const pkgJsonPath = path.join(targetDir, 'package.json');
  const origPkgJsonPath = path.join(targetDir, 'package.original.json');

  for (const plugin of plugins) {
    const version = plugin.version ?? 'latest';

    if (version.startsWith('workspace:')) {
      const workspaceRoot = findPnpmWorkspaceRoot(configDirectory);
      if (!workspaceRoot) {
        logger.warn(
          `Plugin "${plugin.name}" uses workspace: version but no pnpm workspace root found`
        );
        continue;
      }
      const pluginDir = findWorkspacePackage(workspaceRoot, plugin.name);
      if (!pluginDir) {
        logger.warn(`Plugin "${plugin.name}" not found in workspace at ${workspaceRoot}`);
        continue;
      }
      const relPath = path.relative(targetDir, pluginDir);
      for (const jsonPath of [pkgJsonPath, origPkgJsonPath]) {
        const pkg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        pkg.dependencies[plugin.name] = `link:${relPath}`;
        pkg.pnpm.overrides[plugin.name] = `link:${relPath}`;
        fs.writeFileSync(jsonPath, JSON.stringify(pkg, null, 2) + '\n');
      }
      logger.info(`  ${plugin.name} → link:${relPath} (workspace)`);
    } else {
      for (const jsonPath of [pkgJsonPath, origPkgJsonPath]) {
        const pkg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        pkg.dependencies[plugin.name] = version;
        fs.writeFileSync(jsonPath, JSON.stringify(pkg, null, 2) + '\n');
      }
      logger.info(`  ${plugin.name} → ${version} (npm)`);
    }
  }
}

export { readLowdefyYaml };
export default addPlugins;
