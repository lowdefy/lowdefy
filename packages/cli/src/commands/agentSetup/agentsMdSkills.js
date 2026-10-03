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

const SKILLS_START_MARKER = '<!-- lowdefy-skills:start -->';
const SKILLS_END_MARKER = '<!-- lowdefy-skills:end -->';

// The managed list of installed skills inside the Lowdefy section of
// AGENTS.md, for agents that read AGENTS.md rather than .claude/skills. The
// markers let a rerun replace the list without touching the rest of the
// section.
function agentsMdSkills({ skills }) {
  const lines = skills.map((skill) => `- ${skill.agentsMdLine}`).join('\n');
  return `${SKILLS_START_MARKER}
### Agent skills

These skills are installed in \`.claude/skills/\`:

${lines}
${SKILLS_END_MARKER}
`;
}

export { SKILLS_END_MARKER, SKILLS_START_MARKER };
export default agentsMdSkills;
