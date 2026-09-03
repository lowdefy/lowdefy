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
// The branch a stage's workflows watch: main for prod, the stage name for
// everything else — the convention the production Lowdefy apps use. The
// operator edits the generated file when their branching differs.
function getStageBranch({ stage }) {
  if (stage === 'prod' || stage === 'production') {
    return 'main';
  }
  return stage;
}

export default getStageBranch;
