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

const { EXTENSIONS } = require('./profiles.js');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// A shell opens exactly one Lowdefy app: every app's `_js` runs in the shell's one JavaScript realm,
// so two apps in one shell would share its session tokens, storage and cache. app.config.ts (and
// so `expo prebuild` and `expo export`) refuses a shell.json that lists `apps`, or that does not
// name one app with a url for the shell's environment.
function checkShellConfig({ configPath, shell }) {
  const where = `Shell config "${configPath}"`;
  if (!isObject(shell)) {
    throw new Error(`${where} should be an object.`);
  }
  if (Object.prototype.hasOwnProperty.call(shell, 'apps')) {
    throw new Error(
      `${where} lists "apps". A shell opens exactly one app: replace "apps" with "app": { id, name, urls: { <environment>: url } }.`
    );
  }
  if (Array.isArray(shell.app)) {
    throw new Error(
      `${where} names ${shell.app.length} apps in "app". A shell opens exactly one app: "app" should be one { id, name, urls } object.`
    );
  }
  if (!isObject(shell.app)) {
    throw new Error(
      `${where} should name the app it opens as "app": { id, name, urls: { <environment>: url } }. Received ${JSON.stringify(
        shell.app
      )}.`
    );
  }
  if (typeof shell.app.id !== 'string' || shell.app.id.length === 0) {
    throw new Error(
      `${where} "app.id" should be a string. Received ${JSON.stringify(shell.app.id)}.`
    );
  }
  const url = isObject(shell.app.urls) ? shell.app.urls[shell.environment] : undefined;
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error(
      `${where} "app.urls" should have a url for the shell's environment "${
        shell.environment
      }". Received ${JSON.stringify(shell.app.urls)}.`
    );
  }
  if (shell.profile !== undefined && typeof shell.profile !== 'string') {
    throw new Error(
      `${where} "profile" should be the name of a capability profile. Received ${JSON.stringify(
        shell.profile
      )}.`
    );
  }
  // The store version, major.minor.patch; `lowdefy mobile build` sets the patch.
  if (shell.version !== undefined && typeof shell.version !== 'string') {
    throw new Error(
      `${where} "version" should be a string. Received ${JSON.stringify(shell.version)}.`
    );
  }
  // The icon is a path relative to shell.json; `lowdefy mobile config` copies it there.
  if (shell.icon !== undefined && (typeof shell.icon !== 'string' || shell.icon.length === 0)) {
    throw new Error(
      `${where} "icon" should be the path of a PNG, relative to the shell config. Received ${JSON.stringify(
        shell.icon
      )}.`
    );
  }
  if (shell.color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(shell.color)) {
    throw new Error(
      `${where} "color" should be a colour like "#0B5FFF". Received ${JSON.stringify(shell.color)}.`
    );
  }
  if (shell.eas !== undefined) {
    if (!isObject(shell.eas) || typeof shell.eas.projectId !== 'string') {
      throw new Error(
        `${where} "eas" should be { owner, projectId }, the shell's Expo account and project. Received ${JSON.stringify(
          shell.eas
        )}.`
      );
    }
    if (shell.eas.owner !== undefined && typeof shell.eas.owner !== 'string') {
      throw new Error(
        `${where} "eas.owner" should be a string. Received ${JSON.stringify(shell.eas.owner)}.`
      );
    }
  }
  // The opt-in extensions (EXTENSIONS in profiles.js), each named once.
  if (shell.extensions !== undefined) {
    const known = Object.keys(EXTENSIONS);
    if (
      !Array.isArray(shell.extensions) ||
      !shell.extensions.every((name) => known.includes(name)) ||
      new Set(shell.extensions).size !== shell.extensions.length
    ) {
      throw new Error(
        `${where} "extensions" should list each of ${known.join(
          ', '
        )} at most once. Received ${JSON.stringify(shell.extensions)}.`
      );
    }
  }
  // The shell plugins `lowdefy mobile config` installs into the shell project
  // (resolveShellPlugins.js).
  if (shell.plugins !== undefined) {
    checkPlugins({ plugins: shell.plugins, where });
  }
  return shell;
}

function checkPlugins({ plugins, where }) {
  if (!Array.isArray(plugins)) {
    throw new Error(
      `${where} "plugins" should be an array of { name, version, typePrefix?, options? }. Received ${JSON.stringify(
        plugins
      )}.`
    );
  }
  plugins.forEach((plugin, index) => {
    const at = `${where} "plugins[${index}]"`;
    if (!isObject(plugin)) {
      throw new Error(
        `${at} should be { name, version, typePrefix?, options? }. Received ${JSON.stringify(
          plugin
        )}.`
      );
    }
    ['name', 'version'].forEach((key) => {
      if (typeof plugin[key] !== 'string' || plugin[key].length === 0) {
        throw new Error(
          `${at} "${key}" should be a string. Received ${JSON.stringify(plugin[key])}.`
        );
      }
    });
    if (plugin.typePrefix !== undefined && typeof plugin.typePrefix !== 'string') {
      throw new Error(
        `${at} "typePrefix" should be a string. Received ${JSON.stringify(plugin.typePrefix)}.`
      );
    }
    if (plugin.options !== undefined && !isObject(plugin.options)) {
      throw new Error(
        `${at} "options" should be an object. Received ${JSON.stringify(plugin.options)}.`
      );
    }
  });
}

module.exports = checkShellConfig;
