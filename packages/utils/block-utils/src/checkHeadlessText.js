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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// Checks a block meta's headlessText, what a headless journey reads as the text a block draws when
// it has no text model of its own: the paths of the properties the block draws as
// visible text, in order, such as ['title', 'content']. The build checks it as it writes
// blockMetas.json (@lowdefy/build writeBlockSchemaMap), and the headless runner as it reads a
// block's text (@lowdefy/journey-headless readTextModel). Anything else throws, naming the block
// type, rather than reading the block's text wrong. A bad declaration is a mistake in the plugin's
// meta, so it throws a ConfigError with the declaration received.
function checkHeadlessText({ blockType, headlessText }) {
  if (type.isNone(headlessText)) {
    return;
  }
  if (!type.isArray(headlessText)) {
    throw new ConfigError(
      `Block type ${blockType} declares headlessText as ${JSON.stringify(headlessText)}: it should be a list of the property paths the block draws as text, such as ['title', 'content'].`,
      { received: headlessText }
    );
  }
  headlessText.forEach((path, index) => {
    if (type.isString(path) && path !== '') {
      return;
    }
    throw new ConfigError(
      `Block type ${blockType} declares headlessText[${index}] as ${JSON.stringify(path)}: it should be the path of a property the block draws as text.`,
      { received: headlessText }
    );
  });
}

export default checkHeadlessText;
