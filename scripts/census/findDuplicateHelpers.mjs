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

const declaration =
  /(?:^|\n)[ \t]*(?:const|let|var)[ \t]+([A-Za-z_$][\w$]*)[ \t]*=[ \t]*(?:\(|async|function)/g;
const declaredFunction = /(?:^|\n)[ \t]*(?:async[ \t]+)?function[ \t]+([A-Za-z_$][\w$]*)[ \t]*\(/g;

const REPORT_LIMIT = 10;

function helperNamesIn({ body }) {
  const names = [];
  for (const pattern of [declaration, declaredFunction]) {
    pattern.lastIndex = 0;
    let match = pattern.exec(body);
    while (match !== null) {
      names.push(match[1]);
      match = pattern.exec(body);
    }
  }
  return names;
}

function addTo({ index, key, file }) {
  const entry = index.get(key) ?? { copies: 0, files: new Set() };
  entry.copies += 1;
  entry.files.add(file);
  index.set(key, entry);
  return entry;
}

function report({ index, describe }) {
  return [...index.entries()]
    .filter(([, entry]) => entry.files.size > 1)
    .map(([key, entry]) => ({
      ...describe({ key }),
      copies: entry.copies,
      files: entry.files.size,
    }))
    .sort((a, b) => b.copies - a.copies || b.files - a.files)
    .slice(0, REPORT_LIMIT);
}

// Two views of the same absence of a module system. `bodies` catches a whole
// `_js` body pasted into another file verbatim; `helpers` catches the named
// helper — `const esc = (s) => ...` — that was retyped inside otherwise
// different bodies, which is how the reference app's 47 copies of `esc` show up.
// Both only report what spans more than one file: a body repeated inside one
// file is a local pattern, not a missing import.
function findDuplicateHelpers({ bodies }) {
  const byBody = new Map();
  const byName = new Map();
  for (const { file, body } of bodies) {
    addTo({ index: byBody, key: body, file });
    for (const name of new Set(helperNamesIn({ body }))) {
      addTo({ index: byName, key: name, file });
    }
  }
  return {
    jsBodies: bodies.length,
    distinctJsBodies: byBody.size,
    duplicateBodies: report({
      index: byBody,
      describe: ({ key }) => ({ preview: key.split('\n')[0].slice(0, 60) }),
    }),
    duplicateHelpers: report({ index: byName, describe: ({ key }) => ({ name: key }) }),
  };
}

export default findDuplicateHelpers;
