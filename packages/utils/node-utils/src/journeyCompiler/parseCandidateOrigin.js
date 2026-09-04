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

import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

// Reads back the origin block `buildOriginComment` wrote, so a rerun over a
// candidate it already produced updates that file's counts instead of writing a
// second copy of the same journey.
function parseCandidateOrigin({ contents }) {
  if (!type.isString(contents)) return undefined;
  const lines = contents.split('\n');
  const start = lines.findIndex((line) => /^#\s*origin:\s*$/.test(line));
  if (start === -1) return undefined;
  const block = [];
  for (const line of lines.slice(start)) {
    if (!line.startsWith('#')) break;
    block.push(line.replace(/^#\s?/, ''));
  }
  try {
    const parsed = YAML.parse(block.join('\n'));
    return type.isObject(parsed?.origin) ? parsed.origin : undefined;
  } catch {
    // A candidate is a file on disk that anyone may have edited. An origin
    // block that no longer parses is treated as absent, which makes the rerun
    // rewrite it rather than fail the whole compile on one bad file.
    return undefined;
  }
}

export default parseCandidateOrigin;
