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

import urlOf from './urlOf.js';

// Every distinct image url in the tree, reference-style images included.
function collectImageUrls(tree, definitions, urls = []) {
  if (tree.type === 'image' || tree.type === 'imageReference') {
    const url = urlOf(tree, { definitions });
    if (type.isString(url) && !urls.includes(url)) urls.push(url);
  }
  (tree.children ?? []).forEach((child) => collectImageUrls(child, definitions, urls));
  return urls;
}

export default collectImageUrls;
