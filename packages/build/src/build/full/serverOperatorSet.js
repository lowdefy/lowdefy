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

// S3a: the known-operator set for server closure emission mirrors the server
// runtime exactly — both derive from the same typesMap, so emit-time
// known/unknown matches run-time dispatch.
function serverOperatorSet(context) {
  const set = {};
  for (const name of Object.keys(context.typesMap?.operators?.server ?? {})) {
    set[name] = true;
  }
  return set;
}

export default serverOperatorSet;
