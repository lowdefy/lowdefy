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

// Operator metas carry only `hazards`: behaviours of an operator that its
// schema cannot express. The build writes them to plugins/operatorMetas.json
// for the dev MCP; operators without hazards need no entry here.
export const _js = {
  hazards: [
    {
      id: 'js-two-prototypes',
      message:
        'A _js body in a page receives { actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }, while the same body in a request, connection or endpoint receives { args, item, lowdefyApp, payload, secret, state, step, user }. Only where the operator sits in the config decides which, so a body written for one place fails silently in the other.',
      see: 'operators/_js',
    },
  ],
};
