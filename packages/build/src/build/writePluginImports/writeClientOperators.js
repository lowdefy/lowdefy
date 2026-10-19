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

// Every client operator name the app knows, used or not. The server checks
// Dynamic content against it: the client runs only operators it has, so a key
// such as "_score" that names none of them is data, while one that names an
// installed operator the page does not bundle is still an operator.
async function writeClientOperators({ context }) {
  const names = Object.keys(context.typesMap.operators.client).sort();
  await context.writeBuildArtifact('plugins/clientOperators.json', JSON.stringify(names));
}

export default writeClientOperators;
