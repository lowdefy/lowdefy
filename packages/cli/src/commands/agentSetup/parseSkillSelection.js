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

import { type } from '@lowdefy/helpers';

// Resolves the --skills option to the list of topic skills to install. "all" (the default) is
// every available topic, "none" is only lowdefy-config, otherwise a comma-separated list of
// topic names. An unknown name is an error naming the available topics, never a silent skip.
function parseSkillSelection({ selection, available }) {
  const value = type.isNone(selection) ? 'all' : String(selection).trim();
  if (value === 'all' || value === '') {
    return [...available];
  }
  if (value === 'none') {
    return [];
  }
  const names = value
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '');
  const unknown = names.filter((name) => !available.includes(name));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown skill${unknown.length > 1 ? 's' : ''} ${unknown
        .map((name) => `"${name}"`)
        .join(', ')} in --skills. Available skills: ${available.join(', ')}. Use "all" or "none".`
    );
  }
  return available.filter((name) => names.includes(name));
}

export default parseSkillSelection;
