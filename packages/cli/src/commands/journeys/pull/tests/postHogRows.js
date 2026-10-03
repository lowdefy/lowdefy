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

// PostHog HogQL rows in the shape the pull query returns, modelled on rows
// read from a live project's $autocapture, $pageview and failure events: the
// antd radio click (three rows), a menu link, a portal dropdown item with no
// block ids in its chain, and a list-indexed button. Each interaction comes
// enriched (P0's lowdefy_* properties) and chain-only (before enrichment).

const PERSON_ID = '0192f3a4-5b6c-7d8e-9f00-aabbccddeeff';
const ORG_ID = 'org-7f3e2a91';
const SESSION_ID = '0192f3a4-0000-7000-8000-000000000001';
const WINDOW_ID = '0192f3a4-0000-7000-8000-0000000000aa';
const ORIGIN = 'https://app.example.test';

function escape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// One chain entry as posthog-js writes it: `tag.classes:` then the attributes sorted by key.
function entry(tag, { classes = [], attributes = {}, text } = {}) {
  const all = { 'nth-child': 1, 'nth-of-type': 1, ...attributes };
  if (classes.length > 0) all.attr__class = classes.join(' ');
  if (text) all.text = text;
  const pairs = Object.keys(all)
    .sort()
    .map((key) => `${escape(key)}="${escape(all[key])}"`)
    .join('');
  return `${[tag, ...[...classes].sort()].join('.')}:${pairs}`;
}

function wrapper(blockId) {
  return entry('div', { attributes: { attr__id: `bl-${blockId}` } });
}

function chain(...entries) {
  return entries.join(';');
}

function row({
  uuid,
  timestamp,
  event = '$autocapture',
  eventType = null,
  pathname = '/tickets',
  query = '',
  elText = null,
  elementsChain = null,
  personId = PERSON_ID,
  orgId = ORG_ID,
  roles = '["member"]',
  sessionId = SESSION_ID,
  windowId = WINDOW_ID,
  ...lowdefy
}) {
  return {
    uuid,
    timestamp,
    event,
    session_id: sessionId,
    window_id: windowId,
    person_id: personId,
    org_id: orgId,
    roles,
    pathname,
    current_url: `${ORIGIN}${pathname}${query}`,
    event_type: eventType,
    el_text: elText,
    lowdefy_build_id: 'build-2026-10-01T09:00:00.000Z',
    lowdefy_page_id: null,
    lowdefy_block_id: null,
    lowdefy_block_ids: null,
    lowdefy_block_type: null,
    lowdefy_row: null,
    lowdefy_column: null,
    lowdefy_option: null,
    lowdefy_event_scope: null,
    lowdefy_event_name: null,
    lowdefy_debounce_ms: null,
    lowdefy_action_id: null,
    lowdefy_action_type: null,
    lowdefy_error_name: null,
    lowdefy_config_key: null,
    lowdefy_invalid_blocks: null,
    elements_chain: elementsChain,
    ...lowdefy,
  };
}

const chains = {
  radioLabel: chain(
    entry('span', { text: 'High' }),
    entry('label', { classes: ['ant-radio-wrapper'] }),
    entry('div', { classes: ['ant-radio-group'] }),
    wrapper('priority')
  ),
  radioInput: chain(
    entry('input', { classes: ['ant-radio-input'], attributes: { attr__type: 'radio' } }),
    entry('span', { classes: ['ant-radio'] }),
    entry('label', { classes: ['ant-radio-wrapper'], text: 'High' }),
    entry('div', { classes: ['ant-radio-group'] }),
    wrapper('priority')
  ),
  menuLink: chain(
    entry('a', { attributes: { attr__href: '/tickets' }, text: 'Tickets' }),
    entry('li', { classes: ['ant-menu-item'], attributes: { attr__role: 'menuitem' } }),
    wrapper('main_menu')
  ),
  portalOption: chain(
    entry('div', { classes: ['ant-select-item-option-content'], text: 'Alice' }),
    entry('div', { classes: ['ant-select-item', 'ant-select-item-option'] }),
    entry('div', { classes: ['rc-virtual-list'] })
  ),
  listButton: chain(
    entry('span', { text: 'Review' }),
    entry('button', { classes: ['ant-btn'], attributes: { attr__type: 'button' } }),
    wrapper('groups.2.rows.0.review_button'),
    wrapper('groups.2.rows'),
    wrapper('groups')
  ),
  cardTitle: chain(
    entry('h4', { text: 'Ticket T-1' }),
    wrapper('ticket_title'),
    wrapper('ticket_card')
  ),
  noBlockNoText: chain(entry('div', { classes: ['spacer'] })),
};

export { chain, chains, entry, ORG_ID, PERSON_ID, row, SESSION_ID, WINDOW_ID, wrapper };
