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

// The stylesheets an entry needs before its first render, in the order Vite
// links them in the HTML it builds: those of the chunks it imports statically,
// in import order, before its own, each listed once. A later sheet wins a tie
// in the cascade, so the entry's rules override those of what it imports, as
// they do in the dev server.
function collectEntryCss({ manifest, key, css = new Set(), seen = new Set() }) {
  if (seen.has(key)) {
    return css;
  }
  seen.add(key);
  const chunk = manifest[key];
  (chunk.imports ?? []).forEach((importKey) =>
    collectEntryCss({ manifest, key: importKey, css, seen })
  );
  (chunk.css ?? []).forEach((file) => css.add(file));
  return css;
}

export default collectEntryCss;
