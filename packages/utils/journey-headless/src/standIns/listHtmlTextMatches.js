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

import matchHtmlText, { exactTextPattern, normalize } from './matchHtmlText.js';

const { dataEventKeyAttribute } = journeyTargetSelectors;

// The labels antd's en_US locale gives a Popconfirm's buttons, which a ClickableHtml confirm
// shows. An app with i18n locales may show others.
const CONFIRM_BUTTON_TEXT = { ok: 'OK', cancel: 'Cancel' };

function readRowKey(element) {
  const rowKey = element.getAttribute(dataEventKeyAttribute);
  return type.isNone(rowKey) || rowKey === '' ? null : rowKey;
}

// The nearest element around `element` (itself included) that matches `selector` and sits in
// `root`, as HtmlComponent's closestInRoot finds a click's target.
function closestInRoot({ element, root, selector }) {
  const found = element.closest(selector);
  return found !== null && root.contains(found) ? found : null;
}

// What a click on a matched element does, as HtmlComponent's onClick and its enhancers answer it:
// - { kind: 'event', dataEvent, confirm, message, control }: it is in a data-event element whose
//   event the block lists, which fires (or asks first, confirm);
// - { kind: 'popover', trigger }: it is in a data-popover trigger, which opens its popover;
// - { kind: 'none' }: neither, so nothing fires;
// - { kind: 'disabled' }: the element is disabled, which a browser refuses to click;
// - { kind: 'browser', reason }: something a headless run does not model (a link, a copy button,
//   an element inside a disabled control, a trigger in a popover, an element that both fires an
//   event and opens a popover).
function readAction({ block, element, root, where }) {
  const within = (selector) => closestInRoot({ element, root, selector });
  if (within('a') !== null) {
    return { kind: 'browser', reason: 'it is in a link, which a browser follows' };
  }
  if (within('[data-copy]') !== null) {
    return { kind: 'browser', reason: 'it is in a copy button, which a browser runs' };
  }
  if (element.matches(':disabled')) {
    return { kind: 'disabled' };
  }
  if (within(':disabled') !== null) {
    return { kind: 'browser', reason: 'it is inside a disabled control' };
  }
  const eventElement = within('[data-event]');
  const dataEvent = eventElement === null ? null : getDataEvent(eventElement);
  const trigger = within('[data-popover]');
  if (!type.isNone(dataEvent?.name) && trigger !== null) {
    return { kind: 'browser', reason: 'it both fires a data-event and opens a popover' };
  }
  if (trigger !== null && where === 'popover') {
    return { kind: 'browser', reason: 'it opens a popover inside a popover' };
  }
  if (!type.isNone(dataEvent?.name)) {
    const { dataEvents } = block.eval.properties ?? {};
    const rule = findDataEventRule({ dataEvents, name: dataEvent.name });
    if (rule === null) {
      return { kind: 'none' };
    }
    const attributeMessage = eventElement.getAttribute('data-confirm');
    return {
      kind: 'event',
      dataEvent,
      confirm: rule.confirm || eventElement.hasAttribute('data-confirm'),
      message: rule.message ?? (attributeMessage || null),
      control: { control: dataEvent.name, rowKey: readRowKey(eventElement) },
    };
  }
  if (trigger !== null) {
    return { kind: 'popover', trigger };
  }
  return { kind: 'none' };
}

function describeElement({ action, element }) {
  if (action.kind === 'event') {
    const { control, rowKey } = action.control;
    return rowKey === null
      ? `data-event "${control}"`
      : `data-event "${control}" (data-id "${rowKey}")`;
  }
  const text = element.textContent.replace(/\s+/g, ' ').trim();
  return `a <${element.tagName.toLowerCase()}> showing "${text}"`;
}

function toMatches({ block, elements, root, where }) {
  return elements.map((element) => {
    const action = readAction({ block, element, root, where });
    return {
      block,
      where,
      element,
      root,
      action,
      description: describeElement({ action, element }),
    };
  });
}

// The buttons and message of the open confirm a `text` (its buttons) or `containing` (its
// message too) target matches. Their text is antd's en_US labels and the event's message; an app
// with i18n locales, or a confirm whose message is the client's translated default, shows text a
// headless run does not know.
function matchConfirm({ block, confirm, i18n, target }) {
  const buttons = Object.entries(CONFIRM_BUTTON_TEXT).map(([control, text]) => ({ control, text }));
  const knowsButtons = (i18n?.locales ?? []).length === 0;
  if (type.isUndefined(target.containing)) {
    if (!knowsButtons) {
      return { matches: [], uncertain: 'the open confirm labels its buttons in the app locale' };
    }
    const exact = exactTextPattern(String(target.text));
    return {
      matches: buttons
        .filter(({ text }) => exact.test(text))
        .map(({ control, text }) => ({
          block,
          where: 'confirm',
          action: { kind: 'confirm', control },
          description: `the confirm's ${text} button`,
        })),
      uncertain: null,
    };
  }
  if (!knowsButtons || type.isNone(confirm.message)) {
    return { matches: [], uncertain: 'the open confirm shows text in the app locale' };
  }
  const needle = normalize(String(target.containing));
  const message = normalize(confirm.message).includes(needle)
    ? [{ block, where: 'confirm', action: { kind: 'none' }, description: "the confirm's message" }]
    : [];
  return {
    matches: [
      ...message,
      ...buttons
        .filter(({ text }) => normalize(text).includes(needle))
        .map(({ control, text }) => ({
          block,
          where: 'confirm',
          action: { kind: 'confirm', control },
          description: `the confirm's ${text} button`,
        })),
    ],
    uncertain: null,
  };
}

// What a `text` or `containing` target matches in a ClickableHtml: in its html, and with
// `overlays` (a target with no blockId, which searches the page) in its open popover's content
// and its open confirm, which antd draws outside the block. Returns { matches, uncertain }, the
// matches in the order the page shows them (the html, then the popover, then the confirm), each
// { block, where (html, popover or confirm), element and the parsed root it is in, action (readAction, or a confirm button's
// { kind: 'confirm', control }), description }, and why the html alone cannot tell the matches
// (null when it can). html is the block's html, popover the open popover's content html (null
// when none is open) and confirm the open confirm ({ message }, or null).
function listHtmlTextMatches({ block, confirm, html, i18n, overlays, parse, popover, target }) {
  const parts = [{ where: 'html', html }];
  if (overlays && !type.isNone(popover)) {
    parts.push({ where: 'popover', html: popover });
  }
  const read = parts.map(({ where, html: partHtml }) => {
    const root = parse(partHtml);
    const { elements, uncertain } = matchHtmlText({ root, target });
    return { matches: toMatches({ block, elements, root, where }), uncertain };
  });
  if (overlays && !type.isNone(confirm)) {
    read.push(matchConfirm({ block, confirm, i18n, target }));
  }
  return {
    matches: read.flatMap(({ matches }) => matches),
    uncertain: read.find(({ uncertain }) => uncertain !== null)?.uncertain ?? null,
  };
}

export default listHtmlTextMatches;
