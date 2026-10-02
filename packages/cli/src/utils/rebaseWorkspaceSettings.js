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

import path from 'path';
import { type } from '@lowdefy/helpers';

const pathProtocols = ['link:', 'file:'];

const packageExtensionDependencyFields = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
];

function rebasePath({ directory, filePath, workspaceRoot }) {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.relative(directory, path.resolve(workspaceRoot, filePath)).split(path.sep).join('/');
}

// link: and file: specs are relative to the workspace root, which for the
// server is its own directory.
function rebaseSpec({ directory, spec, workspaceRoot }) {
  if (!type.isString(spec)) {
    return spec;
  }
  const protocol = pathProtocols.find((prefix) => spec.startsWith(prefix));
  if (type.isUndefined(protocol)) {
    return spec;
  }
  const filePath = rebasePath({ directory, filePath: spec.slice(protocol.length), workspaceRoot });
  return `${protocol}${filePath}`;
}

function rebaseSpecs({ directory, specs, workspaceRoot }) {
  return Object.fromEntries(
    Object.entries(specs).map(([name, spec]) => [
      name,
      rebaseSpec({ directory, spec, workspaceRoot }),
    ])
  );
}

// A "$name" override takes the version of name in the root package.json,
// which for the server is its own package.json, so it is resolved here
// against the parent's.
function resolveVersionReference({ rootDependencies, spec, workspaceRoot }) {
  if (!type.isString(spec) || !spec.startsWith('$')) {
    return spec;
  }
  const name = spec.slice(1);
  if (type.isNone(rootDependencies[name])) {
    throw new Error(
      `Cannot resolve the override version "${spec}": ${path.join(
        workspaceRoot,
        'package.json'
      )} has no dependency "${name}".`
    );
  }
  return rootDependencies[name];
}

function rebaseOverrides({ directory, overrides, rootDependencies, workspaceRoot }) {
  return Object.fromEntries(
    Object.entries(overrides).map(([selector, spec]) => [
      selector,
      rebaseSpec({
        directory,
        spec: resolveVersionReference({ rootDependencies, spec, workspaceRoot }),
        workspaceRoot,
      }),
    ])
  );
}

function rebasePackageExtensions({ directory, packageExtensions, workspaceRoot }) {
  return Object.fromEntries(
    Object.entries(packageExtensions).map(([selector, extension]) => {
      const rebased = { ...extension };
      packageExtensionDependencyFields.forEach((field) => {
        if (type.isObject(extension[field])) {
          rebased[field] = rebaseSpecs({ directory, specs: extension[field], workspaceRoot });
        }
      });
      return [selector, rebased];
    })
  );
}

// Rewrites the parent workspace's settings for a workspace rooted at
// directory: paths pnpm resolves against the workspace root point at the same
// files, and references to the root package.json are resolved.
function rebaseWorkspaceSettings({ directory, rootDependencies, settings, workspaceRoot }) {
  const rebased = { ...settings };
  if (type.isObject(settings.overrides)) {
    rebased.overrides = rebaseOverrides({
      directory,
      overrides: settings.overrides,
      rootDependencies,
      workspaceRoot,
    });
  }
  if (type.isObject(settings.catalog)) {
    rebased.catalog = rebaseSpecs({ directory, specs: settings.catalog, workspaceRoot });
  }
  if (type.isObject(settings.catalogs)) {
    rebased.catalogs = Object.fromEntries(
      Object.entries(settings.catalogs).map(([name, catalog]) => [
        name,
        rebaseSpecs({ directory, specs: catalog, workspaceRoot }),
      ])
    );
  }
  if (type.isObject(settings.packageExtensions)) {
    rebased.packageExtensions = rebasePackageExtensions({
      directory,
      packageExtensions: settings.packageExtensions,
      workspaceRoot,
    });
  }
  if (type.isObject(settings.patchedDependencies)) {
    rebased.patchedDependencies = Object.fromEntries(
      Object.entries(settings.patchedDependencies).map(([name, filePath]) => [
        name,
        rebasePath({ directory, filePath, workspaceRoot }),
      ])
    );
  }
  if (type.isString(settings.pnpmfile)) {
    rebased.pnpmfile = rebasePath({ directory, filePath: settings.pnpmfile, workspaceRoot });
  }
  if (type.isArray(settings.pnpmfile)) {
    rebased.pnpmfile = settings.pnpmfile.map((filePath) =>
      rebasePath({ directory, filePath, workspaceRoot })
    );
  }
  if (type.isString(settings.onlyBuiltDependenciesFile)) {
    rebased.onlyBuiltDependenciesFile = rebasePath({
      directory,
      filePath: settings.onlyBuiltDependenciesFile,
      workspaceRoot,
    });
  }
  return rebased;
}

export default rebaseWorkspaceSettings;
