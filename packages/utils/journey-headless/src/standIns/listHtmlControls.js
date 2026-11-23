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

import findDataEventRule from '@lowdefy/block-utils/findDataEventRule.js';
import getDataEvent from '@lowdefy/block-utils/getDataEvent.js';
import { journeyTargetSelectors, type } from '@lowdefy/helpers';

const { dataEventKeyAttribute } = journeyTargetSelectors;

// Whether the html hides the element between it and `stop` (exclusive): the hidden attribute or
// an inline display: none or visibility: hidden, as a reader without layout tells it
// (e2e-utils' resolveTargetInDocument reads the same).
function isHiddenBelow({ element, stop }) {
  for (
    let current = element;
    current !== null && current !== stop;
    current = current.parentElement
  ) {
    if (current.hidden) return true;
    const { style } = current;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return true;
  }
  return false;
}

// Where a person reaches the element: 'shown' in the block, 'popover' when it is shown in popover
// content a data-popover trigger in the html opens (the browser runner opens it when no shown
// element matches), else null.
function findReach({ element, root }) {
  const content = element.closest('[data-popover-content]');
  if (content === null) {
    return isHiddenBelow({ element, stop: root }) ? null : 'shown';
  }
  if (isHiddenBelow({ element, stop: content })) {
    return null;
  }
  const id = content.getAttribute('data-popover-content');
  const opened = [...root.querySelectorAll('[data-popover]')].some(
    (trigger) =>
      trigger.getAttribute('data-popover') === id &&
      trigger.closest('[data-popover-content]') === null &&
      !isHiddenBelow({ element: trigger, stop: root })
  );
  return opened ? 'popover' : null;
}

// The controls a ClickableHtml block draws, as markDataEventControls marks them in the browser:
// each data-event element whose event the block's dataEvents lists, keyed by its event, with its
// data-id as its row key (null without one), the event object the browser builds from it
// (getDataEvent) and whether a click asks first (the event's confirm, or data-confirm on the
// element, as confirmEnhancer asks), whether it is disabled, and where it is reached: `shown`, or
// `popover` with the popover content element it is in (findReach). Elements the html hides are
// left out. parse is loadHtmlDom's.
function listHtmlControls({ block, parse }) {
  const { dataEvents, html } = block.eval.properties ?? {};
  const root = parse(type.isNone(html) ? '' : String(html));
  return [...root.querySelectorAll('[data-event]')].flatMap((element) => {
    const name = element.getAttribute('data-event');
    const rule = findDataEventRule({ dataEvents, name });
    const reach = rule === null ? null : findReach({ element, root });
    if (reach === null) {
      return [];
    }
    const rowKey = element.getAttribute(dataEventKeyAttribute);
    return [
      {
        key: name,
        rowKey: type.isNone(rowKey) || rowKey === '' ? null : rowKey,
        dataEvent: getDataEvent(element),
        confirm: rule.confirm || element.hasAttribute('data-confirm'),
        disabled: element.matches(':disabled'),
        reach,
        popover: reach === 'popover' ? element.closest('[data-popover-content]') : null,
      },
    ];
  });
}

export default listHtmlControls;
