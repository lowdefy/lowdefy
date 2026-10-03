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

import walkArtifact from './walkArtifact.js';

// Every mutant the given operators can make in one deserialised artifact, as
// { operator, key, arg, anchor, describe }. A target without a ~k (an object
// the build made rather than read from config) cannot be addressed and is
// left out.
function enumerateArtifact({ artifact, root, operators }) {
  const applicable = operators.filter((operator) =>
    operator.artifacts.some((pattern) => pattern.test(artifact))
  );
  const mutants = [];
  if (applicable.length === 0) {
    return mutants;
  }
  walkArtifact({
    artifact,
    root,
    visit: (visit) => {
      applicable.forEach((operator) => {
        operator
          .enumerate(visit)
          .filter((target) => type.isString(target.key))
          .forEach((target) => mutants.push({ operator: operator.name, ...target }));
      });
    },
  });
  return mutants;
}

export default enumerateArtifact;
