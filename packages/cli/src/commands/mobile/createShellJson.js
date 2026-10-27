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

import { type } from '@lowdefy/helpers';

// The shell's version field is the store version, raised per native build
// by lowdefy mobile build. Until then it is the entry's major.minor at patch 0.
function getStoreVersion(shell) {
  return type.isString(shell.version) ? `${shell.version}.0` : undefined;
}

// The shell plugins as shell.json and the runtime version hash carry them.
// A shell without plugins writes no `plugins`.
function getPlugins(shell) {
  if (!type.isArray(shell.plugins) || shell.plugins.length === 0) {
    return undefined;
  }
  return shell.plugins.map(({ name, version, typePrefix, options }) => ({
    name,
    version,
    typePrefix,
    options,
  }));
}

// The opt-in native extensions (share, widgets, contacts, calendar). A shell
// without any writes no `extensions`, so its runtime version is unchanged.
function getExtensions(shell) {
  if (!type.isArray(shell.extensions) || shell.extensions.length === 0) {
    return undefined;
  }
  return [...shell.extensions];
}

// shell.json is what the copied @lowdefy/shell reads as LOWDEFY_SHELL_CONFIG.
// The shell opens one app, at the URL of the environment it is built for.
function createShellJson({ appMeta, capabilities, environment, profile, shell, url }) {
  return {
    id: shell.id,
    name: shell.name,
    scheme: shell.scheme,
    profile,
    capabilities,
    environment,
    version: getStoreVersion(shell),
    icon: type.isString(shell.icon) ? './icon.png' : undefined,
    color: shell.color,
    ios: type.isObject(shell.ios) ? { bundleIdentifier: shell.ios.bundleId } : undefined,
    android: type.isObject(shell.android) ? { package: shell.android.package } : undefined,
    eas: shell.eas,
    plugins: getPlugins(shell),
    extensions: getExtensions(shell),
    // An app without a slug is still opened by exactly one shell, so the shell
    // id is a stable key for its stored session and cache.
    app: {
      id: appMeta.slug ?? shell.id,
      name: appMeta.name ?? shell.name,
      urls: { [environment]: url },
    },
    store: {},
  };
}

export default createShellJson;
