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

import skillMd from '../skillMd.js';

// The skills agent-setup installs. A skill is added by adding an entry here,
// with its renderer in skills/<camelName>.js.
const skills = [
  {
    name: 'lowdefy-config',
    render: skillMd,
    agentsMdLine:
      '`lowdefy-config`: writing or editing Lowdefy config with exact types, schemas and examples from the dev server.',
  },
];

export default skills;
