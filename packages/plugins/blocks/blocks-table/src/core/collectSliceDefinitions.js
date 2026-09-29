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

// Every state slice the features declare, by name. Slices are React-owned (controlled TanStack
// state), which is what lets a slice update run inside a transition.
function collectSliceDefinitions(features) {
  const definitions = {};
  features.forEach((feature) => {
    Object.entries(feature.slices ?? {}).forEach(([name, definition]) => {
      definitions[name] = { ...definition, feature: feature.name };
    });
  });
  return definitions;
}

export default collectSliceDefinitions;
