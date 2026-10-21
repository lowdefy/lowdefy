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

import path from 'path';

// Every skill is written to both folders. `.agents/skills` is read by Codex,
// Cursor, Copilot, Gemini, Amp and opencode; Claude Code reads only
// `.claude/skills`. Plain copies, not symlinks, which break on Windows clones.
const SKILL_FOLDERS = [path.join('.agents', 'skills'), path.join('.claude', 'skills')];

export default SKILL_FOLDERS;
