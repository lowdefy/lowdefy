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
  return shell;
}

module.exports = checkShellConfig;
