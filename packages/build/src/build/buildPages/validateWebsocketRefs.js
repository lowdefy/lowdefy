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

import { ConfigWarning } from '@lowdefy/errors';

function validateWebsocketRefs({ websocketActionRefs, websocketIds, context }) {
  websocketActionRefs.forEach(({ websocketId, action, actionType, sourcePageId }) => {
    if (action.skip === true) {
      return;
    }

    if (!websocketIds.has(websocketId)) {
      context.handleWarning(
        new ConfigWarning(
          `${actionType} action on page "${sourcePageId}" references non-existent websocket "${websocketId}". ` +
            `Check the websocketId for typos, or add a websocket with id "${websocketId}" to the app config.`,
          { configKey: action['~k'], prodError: true, checkSlug: 'websocket-refs' }
        )
      );
    }
  });
}

export default validateWebsocketRefs;
