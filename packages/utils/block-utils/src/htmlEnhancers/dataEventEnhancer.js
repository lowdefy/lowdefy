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

import makeFocusable from './makeFocusable.js';

// HtmlComponent fires data-event clicks itself (they work without a
// registration). This makes the targets keyboard reachable when the HTML fires
// events: existing targets gain focus, not a new role.
const dataEventEnhancer = {
  name: 'dataEvent',
  attributes: ['data-event'],
  activates: '[data-event]',
  prepare({ dataEvents, select }) {
    if (!dataEvents) return;
    select('[data-event]').forEach(makeFocusable);
  },
};

export default dataEventEnhancer;
