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

const HEADER_START = /^#\s*Recorded candidate, compiled by /;
const ORIGIN_START = /^#\s*origin:\s*$/;
// The origin YAML is a mapping under `origin:`, so every line of it is indented
// past the comment marker's own space. A developer's note (`# my note`) is not.
const ORIGIN_CONTINUATION = /^#\s{2,}\S/;

// Locates the lines a rerun replaces: the header buildOriginComment writes,
// the origin YAML under it and the blank lines that follow, as [start, end).
function findOriginBlock({ lines }) {
  const originIndex = lines.findIndex((line) => ORIGIN_START.test(line));
  if (originIndex === -1) return undefined;
  let end = originIndex + 1;
  while (end < lines.length && ORIGIN_CONTINUATION.test(lines[end])) end += 1;
  while (end < lines.length && lines[end].trim() === '') end += 1;
  const headerIndex = lines.findIndex((line) => HEADER_START.test(line));
  const start = headerIndex !== -1 && headerIndex < originIndex ? headerIndex : originIndex;
  return { start, end };
}

export default findOriginBlock;
