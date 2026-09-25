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

// Largest response returned inline, in serialized characters. The tool result
// is pretty-printed, which adds roughly half again, so this keeps a result
// inside the output budget of common MCP clients.
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

// Returns the result untouched when its response fits inline. A larger
// response, or any response when saveResponse is set, is written in full to
// .lowdefy/responses/ in the config directory, and the result carries the
// file's path and size in its place, so nothing is cut and an agent can read
// or query the whole value.
function fitResponse({ result, name, saveResponse = false }) {
  // A request can resolve with no response; it is written as null.
  const { response = null, ...rest } = result;
  const json = JSON.stringify(response);
  if (!saveResponse && json.length <= MAX_INLINE_RESPONSE_CHARS) {
    return result;
  }
  const fitted = {
    ...rest,
    responseFile: writeResponseFile({ name, response }),
    responseChars: json.length,
  };
  if (Array.isArray(response)) {
    fitted.responseItems = response.length;
  }
  fitted.note = saveResponse
    ? 'The full response was written to responseFile.'
    : `The response is ${json.length} characters, over the ${MAX_INLINE_RESPONSE_CHARS} returned inline, so it was written in full to responseFile. Read or query that file instead.`;
  return fitted;
}

export { MAX_INLINE_RESPONSE_CHARS, MAX_SAVED_RESPONSES };
export default fitResponse;
