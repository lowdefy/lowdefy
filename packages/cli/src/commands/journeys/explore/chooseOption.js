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

// One policy answer for a step: the seeded policy returns an option id, a
// model policy an answer with the option id, its confidence, relevance,
// usage and cost. Both come back as an answer.
async function chooseOption({ policy, step }) {
  if (policy.name === 'seeded') {
    return { optionId: policy.choose(step), asked: false };
  }
  return policy.choose(step);
}

export default chooseOption;
