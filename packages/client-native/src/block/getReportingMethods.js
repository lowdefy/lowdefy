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

import { getTrace } from '@lowdefy/engine';

// The events a person causes by pressing a block, as the interaction a browser recorder would see.
const PRESS_EVENTS = {
  onClick: { kind: 'click' },
  onPressEnter: { kind: 'key', key: 'Enter' },
};

const reportingMethods = new WeakMap();

/**
 * The block's triggerEvent and setValue as its view calls them, reporting each press and change
 * to the engine trace (reportInteraction) before running it, so Lowdefy Dev's recorder sees what a
 * person did by block id, as the web recorder sees DOM clicks and input. Journey steps run on the
 * engine block directly and are not reported. Made once per block, so the functions a view holds
 * stay the same across renders.
 */
function getReportingMethods({ block, lowdefy }) {
  const cached = reportingMethods.get(block);
  if (cached !== undefined) {
    return cached;
  }
  const trace = getTrace(lowdefy);
  const methods = {
    triggerEvent(event) {
      const press = PRESS_EVENTS[event?.name];
      if (press !== undefined) {
        trace.reportInteraction({ ...press, blockId: block.blockId });
      }
      return block.triggerEvent(event);
    },
    setValue(value) {
      trace.reportInteraction({ kind: 'change', blockId: block.blockId, value });
      return block.setValue(value);
    },
  };
  reportingMethods.set(block, methods);
  return methods;
}

export default getReportingMethods;
