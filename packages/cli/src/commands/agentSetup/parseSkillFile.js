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

const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n/;
const HASH_LINE_PATTERN = /^lowdefy-skill-hash:\s*([a-f0-9]{64})\s*$/;

// Splits a SKILL.md into its frontmatter lines without the stored skill hash,
// that hash, and the body below the frontmatter.
function parseSkillFile(content) {
  const match = FRONTMATTER_PATTERN.exec(content);
  if (match === null) {
    return { frontmatter: null, hash: null, body: content };
  }
  const lines = match[1].split('\n');
  const hashLine = lines.find((line) => HASH_LINE_PATTERN.test(line));
  return {
    frontmatter: lines.filter((line) => line !== hashLine).join('\n'),
    hash: hashLine === undefined ? null : HASH_LINE_PATTERN.exec(hashLine)[1],
    body: content.slice(match[0].length),
  };
}

export default parseSkillFile;
