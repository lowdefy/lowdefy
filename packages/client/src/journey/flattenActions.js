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

const CONTROL_KEYS = [':if', ':switch', ':return'];

function isControl(item) {
  return type.isObject(item) && CONTROL_KEYS.some((key) => key in item);
}

// The declared actions of an event, flattened out of the control structure into
// the order the engine numbers them. Controls are not actions - they have no id
// and no response - so only their branches are collected.
function flattenActions(actions, into = []) {
  (actions ?? []).forEach((action) => {
    if (!type.isObject(action)) return;
    if (isControl(action)) {
      if (':if' in action) {
        flattenActions(action[':then'], into);
        flattenActions(action[':else'], into);
      }
      if (':switch' in action) {
        (action[':switch'] ?? []).forEach((caseObject) => {
          flattenActions(caseObject[':then'], into);
        });
        flattenActions(action[':default'], into);
      }
      return;
    }
    into.push(action);
  });
  return into;
}

export default flattenActions;
