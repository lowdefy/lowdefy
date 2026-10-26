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

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Largest value returned inline, in serialized characters. Tool results are
// compact JSON, so a result is about this size, which keeps it inside the
// output budget of common MCP clients.
const MAX_INLINE_RESPONSE_CHARS = 40_000;

// Saved responses kept per app; the oldest beyond this are deleted on write.
const MAX_SAVED_RESPONSES = 20;

function pruneResponseFiles({ directory }) {
  const files = fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => {
      const filePath = path.join(directory, fileName);
      return { filePath, mtime: fs.statSync(filePath).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  files.slice(MAX_SAVED_RESPONSES).forEach(({ filePath }) => fs.rmSync(filePath, { force: true }));
}

function writeResponseFile({ name, response }) {
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  const directory = path.join(configDirectory, '.lowdefy', 'responses');
  const safeName = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = crypto.randomBytes(3).toString('hex');
  const filePath = path.join(directory, `${safeName}-${stamp}-${suffix}.json`);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(response, null, 2));
  pruneResponseFiles({ directory });
  return filePath;
}

// Returns the result untouched when its field (response, by default) fits
// inline. A larger value, or any value when saveResponse is set, is written in
// full to .lowdefy/responses/ in the config directory, and the result carries
// the file's path and size in its place (<field>File, <field>Chars and, for an
// array, <field>Items), so nothing is cut and an agent can read or query the
// whole value.
function fitResponse({ result, name, field = 'response', saveResponse = false }) {
  // A request can resolve with no response; it is written as null.
  const { [field]: value = null, ...rest } = result;
  const json = JSON.stringify(value);
  if (!saveResponse && json.length <= MAX_INLINE_RESPONSE_CHARS) {
    return result;
  }
  const fitted = {
    ...rest,
    [`${field}File`]: writeResponseFile({ name, response: value }),
    [`${field}Chars`]: json.length,
  };
  if (Array.isArray(value)) {
    fitted[`${field}Items`] = value.length;
  }
  fitted.note = saveResponse
    ? `The full ${field} was written to ${field}File.`
    : `The ${field} is ${json.length} characters, over the ${MAX_INLINE_RESPONSE_CHARS} returned inline, so it was written in full to ${field}File. Read or query that file instead.`;
  return fitted;
}

export { MAX_INLINE_RESPONSE_CHARS, MAX_SAVED_RESPONSES };
export default fitResponse;
