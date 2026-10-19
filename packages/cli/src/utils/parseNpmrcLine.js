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

function unquote(text) {
  return text.replace(/^(['"])(.*)\1$/, '$2');
}

// Returns the key and value of a "key=value" line of an .npmrc, unquoted, or
// null for a blank line, a comment, or a line without a value.
function parseNpmrcLine(line) {
  const trimmed = line.trim();
  if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith(';')) {
    return null;
  }
  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex === -1) {
    return null;
  }
  return {
    key: unquote(trimmed.slice(0, separatorIndex).trim()),
    value: unquote(trimmed.slice(separatorIndex + 1).trim()),
  };
}

export default parseNpmrcLine;
