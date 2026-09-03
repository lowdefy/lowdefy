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
import { resolveMigrationStage } from '@lowdefy/node-utils';

// --stages is a comma-separated list; each name must be a valid stage (it
// becomes a filename and a GitHub environment name). Duplicates collapse.
function parseStages({ stages }) {
  const raw = type.isString(stages) && stages.trim() !== '' ? stages : 'dev,prod';
  const names = [];
  raw.split(',').forEach((part) => {
    const name = resolveMigrationStage({ stage: part.trim(), env: {} });
    if (name === null) return;
    if (name === 'local') {
      throw new Error(
        'Stage "local" is reserved for each developer\'s own database and never gets a workflow.'
      );
    }
    if (!names.includes(name)) {
      names.push(name);
    }
  });
  if (names.length === 0) {
    throw new Error('--stages must name at least one stage, e.g. --stages dev,prod.');
  }
  return names;
}

export default parseStages;
