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

import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import rebaseWorkspaceSettings from './rebaseWorkspaceSettings.js';

// The server's own dependencies with build scripts, as in the standalone
// pnpm-workspace.yaml ensurePnpmWorkspaceYaml writes: true runs the script,
// false skips it.
const defaultAllowBuilds = {
  'better-sqlite3': true,
  sharp: true,
  '@sentry/cli': false,
};

// A dependency the parent allows or ignores keeps the parent's choice.
function getDefaultAllowBuilds({ settings }) {
  return Object.fromEntries(
    Object.entries(defaultAllowBuilds).filter(
      ([name]) =>
        type.isUndefined(settings.allowBuilds?.[name]) &&
        !(settings.onlyBuiltDependencies ?? []).includes(name) &&
        !(settings.ignoredBuiltDependencies ?? []).includes(name)
    )
  );
}

function getNames({ allowBuilds, allowed }) {
  return Object.keys(allowBuilds).filter((name) => allowBuilds[name] === allowed);
}

// When only versions younger than its default minimumReleaseAge satisfy a
// dependency, pnpm 11 installs them and records them in the server's
// pnpm-workspace.yaml as minimumReleaseAgeExclude. The file is rewritten on
// every run, so these entries are read back and kept: dropping them makes the
// next install reject its own lockfile. They go when the server directory is
// replaced for another Lowdefy version. The CLI owns the file, so one that does
// not parse is replaced.
function getServerReleaseAgeExclude({ serverWorkspaceYaml }) {
  const document = YAML.parseDocument(serverWorkspaceYaml ?? '');
  if (document.errors.length > 0) {
    return [];
  }
  return document.toJS()?.minimumReleaseAgeExclude ?? [];
}

// Always sorted, the parent's entries too, so the file only changes when the
// set of entries does, whatever order the parent or pnpm wrote them in, and
// the install hash cannot loop or force a second install.
function mergeReleaseAgeExclude({ serverWorkspaceYaml, settings }) {
  const serverExclude = getServerReleaseAgeExclude({ serverWorkspaceYaml });
  if (type.isNone(settings.minimumReleaseAgeExclude) && serverExclude.length === 0) {
    return undefined;
  }
  return [...new Set([...(settings.minimumReleaseAgeExclude ?? []), ...serverExclude])].sort();
}

// The server installs as its own workspace, with a lockfile inside the
// gitignored server directory, so installing it never rewrites the parent's
// committed lockfile. Every parent setting is carried over, rebased to the
// server directory, so the server installs as it would inside the parent.
function createNestedWorkspaceYaml({
  directory,
  parentWorkspace,
  serverWorkspaceYaml,
  workspaceRoot,
}) {
  const settings = rebaseWorkspaceSettings({
    directory,
    packages: parentWorkspace.packages,
    rootDependencies: parentWorkspace.rootDependencies,
    settings: parentWorkspace.settings,
    workspaceRoot,
  });
  const defaults = getDefaultAllowBuilds({ settings });
  const workspace = {
    packages: ['.'],
    ...settings,
    onlyBuiltDependencies: [
      ...new Set([
        ...getNames({ allowBuilds: defaults, allowed: true }),
        ...(settings.onlyBuiltDependencies ?? []),
      ]),
    ],
    ignoredBuiltDependencies: [
      ...new Set([
        ...getNames({ allowBuilds: defaults, allowed: false }),
        ...(settings.ignoredBuiltDependencies ?? []),
      ]),
    ],
    allowBuilds: { ...defaults, ...settings.allowBuilds },
  };
  const minimumReleaseAgeExclude = mergeReleaseAgeExclude({ serverWorkspaceYaml, settings });
  if (!type.isNone(minimumReleaseAgeExclude)) {
    workspace.minimumReleaseAgeExclude = minimumReleaseAgeExclude;
  }
  if (workspace.ignoredBuiltDependencies.length === 0) {
    delete workspace.ignoredBuiltDependencies;
  }
  if (!type.isNone(settings.patchedDependencies)) {
    // The parent's patches are copied whole, and some patch packages only the
    // parent's own projects install.
    workspace.allowUnusedPatches = true;
  }
  return YAML.stringify(workspace);
}

export default createNestedWorkspaceYaml;
