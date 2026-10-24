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

/**
 * A link to the shell's own scheme that the shell handles itself, not the router:
 * - `<scheme>://shortcut/<id>`, from the App Shortcuts intent: { kind: 'shortcut', id };
 * - `<scheme>://expo-sharing`, from the share extension: { kind: 'share' }.
 * null for any other link.
 *
 * @param {string} url
 */
function parseShellLink(url) {
  const match = /^[a-z][a-z0-9+.-]*:\/\/(shortcut\/([^/?#]+)|expo-sharing)(?:[/?#]|$)/.exec(
    url ?? ''
  );
  if (match === null) {
    return null;
  }
  if (match[2] !== undefined) {
    return { kind: 'shortcut', id: decodeURIComponent(match[2]) };
  }
  return { kind: 'share' };
}

export default parseShellLink;
