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

import parseNpmrcLine from './parseNpmrcLine.js';
import rebasePath from './rebasePath.js';

// Keys whose value is a credential (npm's per-registry auth keys, and "key",
// a client certificate's private key), compared in lower case.
const credentialKeys = ['_auth', '_authtoken', '_password', 'key'];

// pnpm expands ${NAME}, and ${NAME-fallback} or ${NAME:-fallback} to the
// fallback when NAME is unset, so a reference with a fallback can hold a
// written-out credential. Only references without one, or with an empty one,
// count as references.
const environmentReference = /\$\{[^${}-]+(:?-)?\}/g;

// The password in a URL's user info, like https://user:pass@host/ or the
// nerf-darted //user:pass@host/.
const userInfoPassword = /\/\/[^/@\s]*:([^/@\s]*)@/;

// Keys holding a path, compared in lower case without dashes. pnpm resolves
// them against the .npmrc's directory, the workspace root or the directory it
// runs in, which for the server are all its own directory.
const pathKeys = [
  'cachedir',
  'cafile',
  'globalbindir',
  'globaldir',
  'globalpnpmfile',
  'onlybuiltdependenciesfile',
  'pnpmfile',
  'statedir',
  'storedir',
];

// Per-registry keys holding a path, like "//registry.example.com/:certfile".
const registryPathKeys = ['cafile', 'certfile', 'keyfile'];

function isEnvironmentReferenceOnly(value) {
  return value.replace(environmentReference, '').trim() === '';
}

// "//registry.example.com/:_authToken" names the key "_authToken".
function holdsLiteralCredential({ key, value }) {
  const keyName = key.slice(key.lastIndexOf(':') + 1).toLowerCase();
  if (credentialKeys.includes(keyName) && !isEnvironmentReferenceOnly(value)) {
    return true;
  }
  return [key, value].some((text) => {
    const userInfo = userInfoPassword.exec(text);
    return userInfo !== null && !isEnvironmentReferenceOnly(userInfo[1]);
  });
}

// The skipped key is reported in a warning, so a password in it is hidden.
function redactUserInfo(key) {
  return key.replace(/\/\/[^/@\s]*@/, '//***@');
}

const copyStartPrefix = '# >>> Copied by Lowdefy from ';
const copyEnd = '# <<< End of the lines copied by Lowdefy.';

// The server package ships its own .npmrc. A previous run's copy of the
// parent's lines is removed to get back to it.
function getServerLines({ serverNpmrc }) {
  const lines = (serverNpmrc ?? '').split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.startsWith(copyStartPrefix));
  if (startIndex === -1) {
    return lines;
  }
  const endIndex = lines.indexOf(copyEnd, startIndex);
  if (endIndex === -1) {
    return lines.slice(0, startIndex);
  }
  return [...lines.slice(0, startIndex), ...lines.slice(endIndex + 1)];
}

function holdsPath(key) {
  if (key.startsWith('//')) {
    return registryPathKeys.includes(key.slice(key.lastIndexOf(':') + 1).toLowerCase());
  }
  return pathKeys.includes(key.toLowerCase().replaceAll('-', ''));
}

function getParentLines({ directory, parentNpmrc, skippedKeys, workspaceRoot }) {
  const lines = [];
  parentNpmrc.split(/\r?\n/).forEach((line) => {
    if (line.trim() === '') {
      return;
    }
    const entry = parseNpmrcLine(line);
    if (entry === null) {
      lines.push(line);
      return;
    }
    const { key, value } = entry;
    if (holdsLiteralCredential({ key, value })) {
      skippedKeys.push(redactUserInfo(key));
      return;
    }
    if (holdsPath(key)) {
      lines.push(`${key}=${rebasePath({ directory, filePath: value, workspaceRoot })}`);
      return;
    }
    lines.push(line);
  });
  return lines;
}

// pnpm reads .npmrc from the project and from the workspace root, which for
// the server are both its own directory, so the parent's .npmrc (scoped
// registries, auth, and in pnpm 10 other settings) is copied into the
// server's, ahead of the server's own lines, which win as they did over the
// parent's. Relative paths are rebased to point at the same files. A
// credential written out in the parent's file is not copied, so the secret
// does not spread to a generated file; credentials that reference an
// environment variable stay references.
function createNestedNpmrc({
  directory,
  parentNpmrc,
  parentNpmrcPath,
  serverNpmrc,
  workspaceRoot,
}) {
  const skippedKeys = [];
  const serverLines = getServerLines({ serverNpmrc });
  if (type.isNone(parentNpmrc)) {
    return { content: serverLines.join('\n'), skippedKeys };
  }
  const content = [
    `${copyStartPrefix}${parentNpmrcPath}; rewritten on every run.`,
    ...getParentLines({ directory, parentNpmrc, skippedKeys, workspaceRoot }),
    copyEnd,
    ...serverLines,
  ].join('\n');
  return { content, skippedKeys };
}

export default createNestedNpmrc;
