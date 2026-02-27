#!/usr/bin/env node
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

/*
  Run a Lowdefy app against the local monorepo without dirtying packages/.

  Usage:
    pnpm dev                                                    # app/ with defaults
    pnpm dev --config-directory /path/to/app --log-level debug  # external app
    pnpm dev --no-open --port 3001                              # custom port, no browser

  How it works:
    1. Builds the monorepo (pnpm build:turbo)
    2. Imports CLI logger from built dist (for spinners and formatted output)
    3. Copies server-dev to <config-dir>/.lowdefy/dev (isolated from monorepo)
    4. Rewrites @lowdefy/* deps to link: paths pointing at monorepo packages
    5. Adds pnpm.overrides so runtime-written version strings still resolve locally
    6. Handles workspace:* plugins from external pnpm monorepos
    7. Runs pnpm install in the isolated copy
    8. Starts the dev server manager (node manager/run.mjs)
*/

import { parseArgs } from 'node:util';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SERVER_DEV_DIR = path.join(REPO_ROOT, 'packages/servers/server-dev');

// -- Arg parsing --

const { values: args } = parseArgs({
  options: {
    'config-directory': { type: 'string', default: path.join(REPO_ROOT, 'app') },
    'log-level': { type: 'string', default: 'info' },
    open: { type: 'boolean', default: false },
    port: { type: 'string', default: '3000' },
    watch: { type: 'string', multiple: true, default: [] },
    'watch-ignore': { type: 'string', multiple: true, default: [] },
    'skip-build': { type: 'boolean', default: false },
  },
  strict: false,
});

const configDirectory = path.resolve(args['config-directory']);
const logLevel = args['log-level'];
const openBrowser = args['open'];
const port = args['port'];
const watchPaths = args['watch'];
const watchIgnorePaths = args['watch-ignore'];
const skipBuild = args['skip-build'];

const devDir = path.resolve(configDirectory, '.lowdefy/dev');

console.log('Lowdefy dev');
console.log(`  Config directory: ${configDirectory}`);
console.log(`  Dev directory:    ${devDir}`);
console.log(`  Port:             ${port}`);
console.log(`  Log level:        ${logLevel}`);
console.log(`  Open browser:     ${openBrowser}`);
console.log('');

// -- Step 1: Build monorepo --

if (!skipBuild) {
  console.log('Building monorepo...');
  execSync('pnpm build:turbo', { cwd: REPO_ROOT, stdio: 'inherit' });
  console.log('');
}

// -- Step 2: Import CLI logger (needs dist from build) --

// Dynamic import: @lowdefy/logger is a workspace package whose dist/ is built by
// pnpm build:turbo above. The repo root can't resolve it by package name, so we
// import directly from the dist path.
const { createCliLogger, createStdOutLineHandler } = await import(
  '../packages/utils/logger/dist/cli/index.js'
);

const logger = createCliLogger({ logLevel });
const context = { logger };
const stdOutLineHandler = createStdOutLineHandler({ context });

// -- Step 3: Copy server-dev to isolated location --

logger.info({ spin: true }, 'Copying server-dev to dev directory...');

const SKIP_DIRS = new Set(['node_modules', '.next', '.turbo']);

// Only skip the top-level build/ directory (generated artifacts).
// Nested build/ directories like lib/build/ contain static source files.
const topLevelBuildDir = path.join(SERVER_DEV_DIR, 'build');

if (fs.existsSync(devDir)) {
  fs.rmSync(devDir, { recursive: true });
}
fs.mkdirSync(devDir, { recursive: true });
fs.cpSync(SERVER_DEV_DIR, devDir, {
  recursive: true,
  filter: (src) => {
    if (src === topLevelBuildDir) {
      return false;
    }
    const basename = path.basename(src);
    if (SKIP_DIRS.has(basename) && src !== SERVER_DEV_DIR) {
      return false;
    }
    return true;
  },
});

// Patch next.config.js to pin react/react-dom to the dev dir's copies.
// Linked @lowdefy/* packages would otherwise resolve react from the monorepo's
// node_modules, creating duplicate React instances and breaking hooks.
const nextConfigPath = path.join(devDir, 'next.config.js');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
fs.writeFileSync(
  nextConfigPath,
  nextConfigContent.replace(
    'webpack: (config, { isServer }) => {',
    [
      'webpack: (config, { isServer }) => {',
      `    // Pin react/react-dom to the dev dir's copies so linked packages`,
      `    // share a single instance (prevents "invalid hook call" errors).`,
      `    // Must alias to the package directory, not the entry file, so that`,
      `    // sub-path imports like react/jsx-runtime still resolve.`,
      `    const reactDir = require('path').dirname(require.resolve('react/package.json'));`,
      `    const reactDomDir = require('path').dirname(require.resolve('react-dom/package.json'));`,
      `    config.resolve.alias = {`,
      `      ...config.resolve.alias,`,
      `      react: reactDir,`,
      `      'react-dom': reactDomDir,`,
      `    };`,
    ].join('\n')
  )
);

logger.info({ succeed: true }, 'Copied server-dev to dev directory.');

// -- Step 4: Build @lowdefy/* package map --

logger.info({ spin: true }, 'Scanning monorepo packages...');

const packageMap = new Map();

function scanForPackages(dir, depth) {
  if (depth > 4) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const entryPath = path.join(dir, entry.name);
    const pkgJsonPath = path.join(entryPath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        if (pkg.name && pkg.name.startsWith('@lowdefy/')) {
          packageMap.set(pkg.name, entryPath);
        }
      } catch {
        // skip invalid package.json
      }
    }
    scanForPackages(entryPath, depth + 1);
  }
}

scanForPackages(path.join(REPO_ROOT, 'packages'), 0);
logger.info({ succeed: true }, `Found ${packageMap.size} @lowdefy/* packages.`);

// -- Step 5: Rewrite deps + add pnpm.overrides --

function rewritePackageJson(filePath) {
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const overrides = {};

  for (const depType of ['dependencies', 'devDependencies']) {
    const deps = pkg[depType];
    if (!deps) continue;
    for (const [name, version] of Object.entries(deps)) {
      if (name.startsWith('@lowdefy/') && packageMap.has(name)) {
        const relPath = path.relative(devDir, packageMap.get(name));
        deps[name] = `link:${relPath}`;
      }
    }
  }

  // Build overrides for all known @lowdefy/* packages
  for (const [name, absDir] of packageMap) {
    const relPath = path.relative(devDir, absDir);
    overrides[name] = `link:${relPath}`;
  }

  pkg.pnpm = pkg.pnpm ?? {};
  pkg.pnpm.overrides = overrides;

  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
}

logger.info({ spin: true }, 'Rewriting package.json files with link: paths...');
rewritePackageJson(path.join(devDir, 'package.json'));
rewritePackageJson(path.join(devDir, 'package.original.json'));
logger.info({ succeed: true }, 'Rewrote package.json files.');

// -- Step 6: Handle custom plugins from lowdefy.yaml --

function readLowdefyYaml() {
  for (const filename of ['lowdefy.yaml', 'lowdefy.yml']) {
    const filePath = path.join(configDirectory, filename);
    if (fs.existsSync(filePath)) {
      // Simple YAML parsing for the plugins array - we only need top-level plugins key.
      // Import yaml dynamically since it's available in server-dev deps.
      const content = fs.readFileSync(filePath, 'utf8');
      // Use a basic regex approach to extract plugins to avoid importing yaml parser
      // The plugins section is simple enough for line-based parsing.
      return content;
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
  // Read pnpm-workspace.yaml to get package patterns, then search
  // For simplicity, scan common locations
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
  if ((value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }
  return value;
}

function addCustomPlugins() {
  const yamlContent = readLowdefyYaml();
  if (!yamlContent) return;

  // Parse plugins array from YAML content
  // Format:  plugins:
  //            - name: package-name
  //              version: 1.0.0
  // Capture all indented lines after `plugins:` until the next top-level key or EOF
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

  const pkgJsonPath = path.join(devDir, 'package.json');
  const origPkgJsonPath = path.join(devDir, 'package.original.json');

  for (const plugin of plugins) {
    const version = plugin.version ?? 'latest';

    if (version.startsWith('workspace:')) {
      // Find the package in the host workspace
      const workspaceRoot = findPnpmWorkspaceRoot(configDirectory);
      if (!workspaceRoot) {
        logger.warn(
          `Plugin "${plugin.name}" uses workspace: version but no pnpm workspace root found`
        );
        continue;
      }
      const pluginDir = findWorkspacePackage(workspaceRoot, plugin.name);
      if (!pluginDir) {
        logger.warn(
          `Plugin "${plugin.name}" not found in workspace at ${workspaceRoot}`
        );
        continue;
      }
      const relPath = path.relative(devDir, pluginDir);
      for (const jsonPath of [pkgJsonPath, origPkgJsonPath]) {
        const pkg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        pkg.dependencies[plugin.name] = `link:${relPath}`;
        pkg.pnpm.overrides[plugin.name] = `link:${relPath}`;
        fs.writeFileSync(jsonPath, JSON.stringify(pkg, null, 2) + '\n');
      }
      logger.info(`  ${plugin.name} → link:${relPath} (workspace)`);
    } else {
      // npm package with version
      for (const jsonPath of [pkgJsonPath, origPkgJsonPath]) {
        const pkg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        pkg.dependencies[plugin.name] = version;
        fs.writeFileSync(jsonPath, JSON.stringify(pkg, null, 2) + '\n');
      }
      logger.info(`  ${plugin.name} → ${version} (npm)`);
    }
  }
}

addCustomPlugins();

// -- Step 7: Create isolated workspace --

logger.info({ spin: true }, 'Creating isolated pnpm workspace...');
fs.writeFileSync(path.join(devDir, 'pnpm-workspace.yaml'), 'packages: []\n');

// Copy .npmrc to ensure strict-peer-dependencies=false is set
if (!fs.existsSync(path.join(devDir, '.npmrc'))) {
  fs.writeFileSync(path.join(devDir, '.npmrc'), 'strict-peer-dependencies=false\n');
}

logger.info({ succeed: true }, 'Created isolated pnpm workspace.');

// -- Step 8: Install dependencies --

logger.info({ spin: true }, 'Installing dependencies...');
execSync('pnpm install --no-lockfile', { cwd: devDir, stdio: 'inherit' });
logger.info({ succeed: true }, 'Dependencies installed.');

// -- Step 9: Start the dev server --

logger.info({ spin: true }, 'Starting dev server...');

const env = {
  ...process.env,
  LOWDEFY_DIRECTORY_CONFIG: configDirectory,
  LOWDEFY_LOG_LEVEL: logLevel,
  LOWDEFY_SERVER_DEV_OPEN_BROWSER: openBrowser ? 'true' : 'false',
  PORT: port,
};

if (watchPaths.length > 0) {
  env.LOWDEFY_SERVER_DEV_WATCH = JSON.stringify(watchPaths);
}
if (watchIgnorePaths.length > 0) {
  env.LOWDEFY_SERVER_DEV_WATCH_IGNORE = JSON.stringify(watchIgnorePaths);
}

const child = spawn('node', ['manager/run.mjs'], {
  cwd: devDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  env,
});

function createLineHandler(handler) {
  let buffer = '';
  return (data) => {
    const text = buffer + data.toString('utf8');
    const lines = text.split('\n');
    buffer = lines.pop();
    lines.forEach((line) => {
      if (line) handler(line);
    });
  };
}

child.stdout.on('data', createLineHandler(stdOutLineHandler));
child.stderr.on('data', createLineHandler(stdOutLineHandler));

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

// Forward signals to child
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
