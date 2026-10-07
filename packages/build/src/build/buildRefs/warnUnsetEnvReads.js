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

import { ConfigWarning } from '@lowdefy/errors';

function formatLocation({ filePath, lineNumber }) {
  return lineNumber ? `${filePath}:${lineNumber}` : filePath;
}

// Refs resolve concurrently, so reads arrive in no fixed order: sort them, so
// the warnings read and locate the same on every build.
function compareReads(a, b) {
  if (a.filePath !== b.filePath) return a.filePath < b.filePath ? -1 : 1;
  return (a.lineNumber ?? 0) - (b.lineNumber ?? 0);
}

// One warning per unset variable, located at its first read (by file and line)
// and listing every read, so a variable read in many places does not bury the
// other warnings. The dedupKey makes handleWarning show it once even when
// several page builds on one dev context each read the variable.
function warnUnsetEnvReads({ context }) {
  const names = [...context.unsetEnvReads.keys()].sort();
  for (const name of names) {
    const unsortedReads = context.unsetEnvReads.get(name);
    const reads = [...unsortedReads].sort(compareReads);
    const locations = [...new Set(reads.map(formatLocation))];
    const readAt =
      locations.length > 1 ? ` in ${locations.length} places (${locations.join(', ')})` : '';
    const warning = new ConfigWarning(
      `Environment variable "${name}" is not set. _build.env read it at build time${readAt} and inlined null; set it in the build environment or in .env, or give the operator a default.`,
      { ...reads[0], checkSlug: 'secrets' }
    );
    warning.dedupKey = `_build.env:${name}`;
    context.handleWarning(warning);
  }
  context.unsetEnvReads.clear();
}

export default warnUnsetEnvReads;
