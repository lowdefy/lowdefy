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

// The document's link definitions ([id]: https://...) as identifier -> url, so
// reference-style links and images resolve to the same thing they do on the page.
function collectDefinitions(tree, definitions = {}) {
  if (tree?.type === 'definition' && type.isString(tree.url)) {
    definitions[tree.identifier] = tree.url;
  }
  (tree?.children ?? []).forEach((child) => collectDefinitions(child, definitions));
  return definitions;
}

export default collectDefinitions;
