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

// Reading and writing the parts of a SKILL.md file: the frontmatter, the generated Reference
// region between the markers, and the hand-written Recipe below it.

export const GENERATED_START = '<!-- generated:reference:start -->';
export const GENERATED_END = '<!-- generated:reference:end -->';
export const RECIPE_HEADING = '## Recipe';

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    return null;
  }
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    frontmatter[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return frontmatter;
}

export function findGeneratedRegion(content) {
  const start = content.indexOf(GENERATED_START);
  const end = content.indexOf(GENERATED_END);
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  return { start, end: end + GENERATED_END.length };
}

// Replaces the generated region and leaves every other byte of the file untouched.
export function replaceGeneratedRegion({ content, generated }) {
  const region = findGeneratedRegion(content);
  if (region === null) {
    throw new Error(
      `Skill file has no generated markers. Expected "${GENERATED_START}" and "${GENERATED_END}".`
    );
  }
  return content.slice(0, region.start) + generated + content.slice(region.end);
}

export function wrapGenerated(body) {
  return `${GENERATED_START}\n${body}\n${GENERATED_END}`;
}

export const SKILL_KINDS = ['recipe', 'reference'];

// The frontmatter is generated in full from the manifest and the running framework version, so a
// changed description or kind reaches an existing skill and every file carries the version it was
// generated from. Everything below the closing "---" is left untouched.
export function renderFrontmatter({ name, description, kind, version }) {
  return `---
name: ${name}
description: ${description}
kind: ${kind}
lowdefyVersion: ${version}
---
`;
}

export function replaceFrontmatter({ content, frontmatter }) {
  const match = content.match(/^---\n[\s\S]*?\n---\n/);
  if (!match) {
    throw new Error('Skill file has no frontmatter block. Expected it to start with "---".');
  }
  return frontmatter + content.slice(match[0].length);
}

export function createSkillFile({ name, description, kind, version, title, generated, recipe }) {
  return `${renderFrontmatter({ name, description, kind, version })}
# ${title}

${wrapGenerated(generated)}

${RECIPE_HEADING}

${recipe}
`;
}
