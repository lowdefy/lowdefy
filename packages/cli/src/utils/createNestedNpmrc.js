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

// Keys whose value is a credential (npm's per-registry auth keys, and "key",
// a client certificate's private key).
const credentialKeys = ['_auth', '_authToken', '_password', 'key'];

const environmentReference = /\$\{[^}]*\}/g;

function isEnvironmentReferenceOnly(value) {
  return value.replace(environmentReference, '').trim() === '';
}

// "//registry.example.com/:_authToken" names the key "_authToken".
function holdsLiteralCredential({ key, value }) {
  const keyName = key.slice(key.lastIndexOf(':') + 1);
  if (credentialKeys.includes(keyName)) {
    return !isEnvironmentReferenceOnly(value);
  }
  // A registry or proxy URL with a password, like https://user:pass@host/.
  const userInfo = /:\/\/[^/@\s]*:([^/@\s]*)@/.exec(value);
  if (userInfo !== null) {
    return !isEnvironmentReferenceOnly(userInfo[1]);
  }
  return false;
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

function getParentLines({ parentNpmrc, skippedKeys }) {
  return parentNpmrc
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.startsWith(';')) {
        return true;
      }
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return true;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^(['"])(.*)\1$/, '$2');
      if (holdsLiteralCredential({ key, value })) {
        skippedKeys.push(key);
        return false;
      }
      return true;
    });
}

// pnpm reads .npmrc from the project and from the workspace root, which for
// the server are both its own directory, so the parent's .npmrc (scoped
// registries, auth, and in pnpm 10 other settings) is copied into the
// server's, ahead of the server's own lines, which win as they did over the
// parent's. A credential written out in the parent's file is not copied, so
// the secret does not spread to a generated file; credentials that reference
// an environment variable stay references.
function createNestedNpmrc({ parentNpmrc, parentNpmrcPath, serverNpmrc }) {
  const skippedKeys = [];
  const serverLines = getServerLines({ serverNpmrc });
  if (type.isNone(parentNpmrc)) {
    return { content: serverLines.join('\n'), skippedKeys };
  }
  const content = [
    `${copyStartPrefix}${parentNpmrcPath}; rewritten on every run.`,
    ...getParentLines({ parentNpmrc, skippedKeys }),
    copyEnd,
    ...serverLines,
  ].join('\n');
  return { content, skippedKeys };
}

export default createNestedNpmrc;
