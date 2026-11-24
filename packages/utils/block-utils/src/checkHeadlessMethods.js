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

// Checks a block meta's headlessMethods, the methods a headless journey runs for a CallMethod on a
// block whose component it does not load: { [method]: the name of the block event the method
// fires }, or null for a method that changes only what the block draws, which a headless run calls
// as a no-op. The build checks it as it writes blockMetas.json (@lowdefy/build
// writeBlockSchemaMap), and the headless runner as it registers the methods (@lowdefy/
// journey-headless registerHeadlessMethods). Anything else throws, naming the block type and the
// method, rather than leaving the method to the browser unseen. A bad declaration is a mistake in
// the plugin's meta, so it throws a ConfigError with the declaration received.
function checkHeadlessMethods({ blockType, headlessMethods }) {
  if (type.isNone(headlessMethods)) {
    return;
  }
  if (!type.isObject(headlessMethods)) {
    throw new ConfigError(
      `Block type ${blockType} declares headlessMethods as ${JSON.stringify(headlessMethods)}: it should be an object of { [method]: the name of the event it fires, or null }.`,
      { received: headlessMethods }
    );
  }
  Object.entries(headlessMethods).forEach(([method, name]) => {
    if (name === null || (type.isString(name) && name !== '')) {
      return;
    }
    throw new ConfigError(
      `Block type ${blockType} declares headlessMethods.${method} as ${JSON.stringify(name)}: it should be the name of the block event the method fires, or null for a method that changes only what the block draws.`,
      { received: headlessMethods }
    );
  });
}

export default checkHeadlessMethods;
