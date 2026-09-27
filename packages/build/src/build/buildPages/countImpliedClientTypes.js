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

import jsAccessorOperators from '../jsAccessorOperators.js';

// Client types a page runs without its config naming them: the actions and
// operators of the events a block registers itself (block meta actions and
// operators, such as a file block's Request), and the operators the _js
// accessors call. Counting them through the page's tee counters puts them in
// both the app bundle and the page's own type set, so a page loaded cold has
// them as well as one reached from a page that happened to load them.
function countImpliedClientTypes({ blockMetas, pageCounters, typeCounters }) {
  Object.keys(pageCounters.blocks.getCounts()).forEach((blockType) => {
    const meta = blockMetas[blockType] ?? {};
    const configKey = pageCounters.blocks.getLocation(blockType);
    (meta.actions ?? []).forEach((actionType) =>
      typeCounters.actions.increment(actionType, configKey)
    );
    (meta.operators ?? []).forEach((operator) =>
      typeCounters.operators.client.increment(operator, configKey)
    );
  });
  if (pageCounters.operators.getCount('_js') > 0) {
    const configKey = pageCounters.operators.getLocation('_js');
    jsAccessorOperators.forEach((operator) =>
      typeCounters.operators.client.increment(operator, configKey)
    );
  }
}

export default countImpliedClientTypes;
