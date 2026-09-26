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

// An icon set layer as loadIconSets returns it, drawing the given icons.
function createTestIconLayer({ packageName = 'test-icons', icons = {}, attrs, semantic }) {
  return {
    attrs,
    loadIcons: async ({ names }) =>
      Object.fromEntries(
        names.filter((name) => Object.hasOwn(icons, name)).map((name) => [name, icons[name]])
      ),
    names: new Set(Object.keys(icons)),
    package: packageName,
    semantic,
  };
}

export default createTestIconLayer;
