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

// $out and $merge write a collection from the pipeline's output, so no
// per-row stamp or check can run on the rows they write. Returns the stage's
// operator, or null for a stage that writes nothing.
function getCollectionWriteStage({ stage }) {
  if (stage.$out !== undefined) return '$out';
  if (stage.$merge !== undefined) return '$merge';
  return null;
}

export default getCollectionWriteStage;
