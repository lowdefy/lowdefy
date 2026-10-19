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
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';
import { readFile } from '@lowdefy/node-utils';

import getPnpmMajorVersion from './getPnpmMajorVersion.js';
import parseNpmrcLine from './parseNpmrcLine.js';

// The settings pnpm 10 reads from the "pnpm" field of the root package.json.
// pnpm 11 reads none of them, so this list does not grow, and they are only
// carried when pnpm 10 or earlier installs the server.
const manifestSettingKeys = [
  'allowBuilds',
  'allowNonAppliedPatches',
  'allowUnusedPatches',
  'allowedDeprecatedVersions',
  'auditConfig',
  'configDependencies',
  'executionEnv',
  'ignorePatchFailures',
  'ignoredBuiltDependencies',
  'ignoredOptionalDependencies',
  'neverBuiltDependencies',
  'onlyBuiltDependencies',
  'onlyBuiltDependenciesFile',
  'overrides',
  'packageExtensions',
  'patchedDependencies',
  'peerDependencyRules',
  'requiredScripts',
  'supportedArchitectures',
  'updateConfig',
];

// The pnpmfiles pnpm loads from the workspace root when "pnpmfile" is not set,
// in the order pnpm 11 tries them (pnpm 10 only loads .pnpmfile.cjs).
const defaultPnpmfiles = ['.pnpmfile.mjs', '.pnpmfile.cjs'];

async function readWorkspaceYaml({ workspaceRoot }) {
  const filePath = path.join(workspaceRoot, 'pnpm-workspace.yaml');
  const document = YAML.parseDocument((await readFile(filePath)) ?? '');
  if (document.errors.length > 0) {
    throw new Error(`Could not parse ${filePath}: ${document.errors[0].message}`);
  }
  return document.toJS() ?? {};
}

async function readPackageJson({ workspaceRoot }) {
  const filePath = path.join(workspaceRoot, 'package.json');
  const content = await readFile(filePath);
  if (type.isNone(content)) {
    return {};
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Could not parse ${filePath}: ${error.message}`);
  }
}

// pnpm 10 also reads "pnpmfile" from .npmrc (pnpm 11 reads only registry and
// auth settings there). The copied .npmrc carries it to the server, where a
// pnpmfile in pnpm-workspace.yaml would override it.
function npmrcSetsPnpmfile({ npmrc }) {
  return (npmrc ?? '').split(/\r?\n/).some((line) => {
    const entry = parseNpmrcLine(line);
    return entry !== null && entry.key.toLowerCase() === 'pnpmfile';
  });
}

function getManifestSettings({ packageJson }) {
  const settings = {};
  manifestSettingKeys.forEach((key) => {
    if (!type.isNone(packageJson.pnpm?.[key])) {
      settings[key] = packageJson.pnpm[key];
    }
  });
  // pnpm 10 also reads Yarn's "resolutions" as overrides.
  const overrides = { ...packageJson.resolutions, ...packageJson.pnpm?.overrides };
  if (Object.keys(overrides).length > 0) {
    settings.overrides = overrides;
  }
  return settings;
}

// Everything the parent workspace's install depends on, so the generated
// server, which installs as its own workspace, can install the same way.
// Every setting is carried except "packages": new pnpm settings follow without
// a change here. Settings the installing pnpm would ignore in the parent are
// left out, so the server installs as the parent does.
async function readParentWorkspace({ pnpmCmd, workspaceRoot }) {
  const workspaceYaml = await readWorkspaceYaml({ workspaceRoot });
  const packageJson = await readPackageJson({ workspaceRoot });
  const { packages, ...workspaceSettings } = workspaceYaml;
  const npmrcPath = path.join(workspaceRoot, '.npmrc');
  const npmrc = await readFile(npmrcPath);
  const readsPnpm10Settings = getPnpmMajorVersion({ packageJson, pnpmCmd, workspaceRoot }) < 11;

  // pnpm 10 installs with the package.json settings over the
  // pnpm-workspace.yaml settings where both set one.
  const settings = {
    ...workspaceSettings,
    ...(readsPnpm10Settings ? getManifestSettings({ packageJson }) : {}),
  };
  const pnpmfileInNpmrc = readsPnpm10Settings && npmrcSetsPnpmfile({ npmrc });
  if (type.isNone(settings.pnpmfile) && !pnpmfileInNpmrc) {
    const defaultPnpmfile = defaultPnpmfiles.find((fileName) =>
      fs.existsSync(path.join(workspaceRoot, fileName))
    );
    if (!type.isNone(defaultPnpmfile)) {
      settings.pnpmfile = defaultPnpmfile;
    }
  }

  return {
    devEnginesPackageManager: packageJson.devEngines?.packageManager,
    npmrc,
    npmrcPath,
    packageManager: packageJson.packageManager,
    packages: packages ?? [],
    rootDependencies: {
      ...packageJson.devDependencies,
      ...packageJson.dependencies,
      ...packageJson.optionalDependencies,
    },
    settings,
  };
}

export default readParentWorkspace;
