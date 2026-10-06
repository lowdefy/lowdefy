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

import maskEventText from './maskEventText.js';
import postHogState from './postHogState.js';

// The events autocapture records with an `$elements_chain`.
const AUTOCAPTURE_EVENTS = ['$autocapture', '$rageclick', '$dead_click'];

// The lowdefy_* properties of a described target. Null, false and empty values are left out, so
// an event only carries what it says. The text is not repeated: `$el_text` has it.
function targetProperties(target) {
  const properties = {
    lowdefy_page_id: target.page_id,
    lowdefy_block_id: target.block_id,
    lowdefy_block_type: target.block_type,
    lowdefy_row: target.row,
    lowdefy_column: target.column,
    lowdefy_block_ids: target.block_ids,
    lowdefy_option: target.option,
  };
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([, value]) =>
        !type.isNone(value) && value !== false && !(type.isArray(value) && value.length === 0)
    )
  );
}

// posthog-js before_send: stamps Lowdefy semantics onto events, from the trace registry the last
// PostHogInit stored. Clicks get the block they hit; every event gets the page it was captured
// on and that page's path values. Then, unless maskDataText is false, the text of the app's data
// is masked, after describeChain has read the full chain. It adds no event and always returns
// the event it was given.
function enrichEvent(event) {
  const { maskDataText, trace } = postHogState;
  const { properties } = event;
  if (AUTOCAPTURE_EVENTS.includes(event.event) && type.isString(properties.$elements_chain)) {
    Object.assign(properties, targetProperties(trace.describeChain(properties.$elements_chain)));
  }
  // Some events, such as session recording snapshots, carry no URL.
  const entry = type.isString(properties.$current_url)
    ? trace.pathEntryOf(properties.$current_url)
    : null;
  if (!type.isNone(entry)) {
    if (type.isNone(properties.lowdefy_page_id)) {
      properties.lowdefy_page_id = entry.pageId;
    }
    if (properties.lowdefy_page_id === entry.pageId) {
      properties.lowdefy_path_params = entry.pathParams;
    }
  }
  if (maskDataText !== false) {
    maskEventText({ event, trace, pageId: properties.lowdefy_page_id ?? null });
  }
  return event;
}

export default enrichEvent;
