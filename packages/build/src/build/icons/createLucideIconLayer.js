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

import { icons } from 'lucide';

// The bottom layer of the "lucide" set. lucide's IconNode arrays already use
// React attribute names on a 24px viewBox, and lucide-react draws them with
// Lucide's default stroke attributes, so each icon's IconData is its node.
function createLucideIconLayer() {
  return {
    package: 'lucide',
    names: new Set(Object.keys(icons)),
    loadIcons: async ({ names }) => {
      const iconData = {};
      names.forEach((name) => {
        if (Object.hasOwn(icons, name)) {
          iconData[name] = { node: icons[name] };
        }
      });
      return iconData;
    },
  };
}

export default createLucideIconLayer;
