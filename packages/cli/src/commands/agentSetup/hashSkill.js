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

import crypto from 'crypto';

// The hash agent-setup stores in a generated skill's frontmatter: a rerun
// overwrites the file only while its body still hashes to it, so a skill a
// developer edited is never clobbered.
function hashSkillBody(body) {
  return crypto.createHash('sha256').update(body).digest('hex');
}

export default hashSkillBody;
