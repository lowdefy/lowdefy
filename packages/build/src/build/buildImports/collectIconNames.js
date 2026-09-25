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

// A semantic, qualified or set name.
const namePattern = '[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?::[A-Z][A-Za-z0-9]*)?|[A-Z][A-Za-z0-9]*';

// A name as a whole quoted string: a JSON string value ("edit"), a JS literal
// ('edit' or "edit"), or a JS literal inside a JSON string (\"edit\", _js code
// in page config). Object keys ("edit":) are skipped; a colon after whitespace
// is a JS ternary ('edit' : 'close'), not a key. Values of `type` keys are
// skipped too: 15 Lowdefy type names are also Lucide names (Box, Menu, List,
// Link, ...), and every app would otherwise bundle icons for its block types.
const quotedNameRegex = new RegExp(
  `(?<!\\btype\\\\?["']?\\s*:\\s*)(\\\\?["'])(${namePattern})\\1(?!:)`,
  'g'
);

// data-icon attribute values inside HTML strings or JS sources: any case,
// optional whitespace around =, quoted or unquoted. In JSON text a double quote
// inside a string is escaped (data-icon=\"edit\"). The value must end at a
// quote, whitespace or > so a templated value ("edit-{{ n }}") is skipped
// rather than read as a name; dynamic names belong in theme.icons.include.
const dataIconRegex = /data-icon\s*=\s*(?:\\?["'])?([A-Za-z][A-Za-z0-9:-]*)(?=\\?["']|[\s>]|$)/gi;

// Returns every string in the text that could be an icon name: JSON config
// text, or the source of a _js function. Callers keep the candidates that
// resolve. Over-matching costs one icon's bytes, while a missed name renders
// the fallback icon in production.
function collectIconNames({ text }) {
  const names = new Set();
  for (const match of text.matchAll(quotedNameRegex)) {
    names.add(match[2]);
  }
  for (const match of text.matchAll(dataIconRegex)) {
    names.add(match[1]);
  }
  return names;
}

export { dataIconRegex };
export default collectIconNames;
