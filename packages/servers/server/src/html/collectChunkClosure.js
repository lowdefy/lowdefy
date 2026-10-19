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

// Every JS file and stylesheet a dynamic entry needs, following its static
// imports - what the browser would otherwise discover one round trip at a time.
function collectChunkClosure({ manifest, key, js, css }) {
  const chunk = manifest[key];
  if (js.has(chunk.file)) {
    return;
  }
  js.add(chunk.file);
  (chunk.css ?? []).forEach((file) => css.add(file));
  (chunk.imports ?? []).forEach((importKey) =>
    collectChunkClosure({ manifest, key: importKey, js, css })
  );
}

export default collectChunkClosure;
