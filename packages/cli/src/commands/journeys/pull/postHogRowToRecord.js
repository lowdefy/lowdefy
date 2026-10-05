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

import { parsePageId, targetFromElementsChain, type } from '@lowdefy/helpers';

import hashId from './hashId.js';
import normalisePostHogRow from './normalisePostHogRow.js';
import tokenText from '../tokenText.js';

const INTERACTION_KINDS = { click: 'click', change: 'change' };
const FRUSTRATIONS = { $rageclick: 'rage', $dead_click: 'dead' };
const SCOPES = ['page', 'app'];

// Query parameter names only (`/tickets?id=&tab=`): record ids live in the
// values, so production never keeps one.
function urlWithQueryNames({ currentUrl, pathname }) {
  if (type.isNone(currentUrl)) return pathname;
  let url;
  try {
    url = new URL(currentUrl, 'http://lowdefy.invalid');
  } catch {
    return pathname;
  }
  const names = [...new Set(url.searchParams.keys())];
  const query = names.length === 0 ? '' : `?${names.map((name) => `${name}=`).join('&')}`;
  return `${url.pathname}${query}`;
}

function pathnameOf({ values }) {
  if (!type.isNone(values.pathname)) return values.pathname;
  if (type.isNone(values.currentUrl)) return null;
  try {
    return new URL(values.currentUrl, 'http://lowdefy.invalid').pathname;
  } catch {
    return null;
  }
}

// Lowdefy routes are `/<pageId>`: `/` is the redirect to the home page (the
// next pageview names the page) and a path with a further `/` is not a page.
function resolvePage({ values, pathname }) {
  const pageId = values.pageId ?? (type.isNone(pathname) ? null : parsePageId(pathname));
  if (type.isNone(pageId)) return { reason: 'home_redirect' };
  if (pageId.includes('/')) return { reason: 'not_a_page' };
  return { pageId };
}

// Lowdefy's own properties when P0's enrichment ran, else the target read
// from the elements chain, whose blocks have no type. `block_ids` feeds the
// pairing rule and never goes into the record. Clicked text is never kept:
// it is stored as a salted token, which readers resolve only to config text.
function resolveTarget({ values, salt }) {
  const textToken = tokenText({ salt, text: values.elText });
  if (!type.isNone(values.blockId)) {
    return {
      chainFallback: false,
      blockIds: values.blockIds ?? [values.blockId],
      target: {
        block_id: values.blockId,
        block_type: values.blockType,
        row: values.row,
        column: values.column,
        text_token: textToken,
        nth: null,
        option: values.option,
      },
    };
  }
  const chain = targetFromElementsChain(values.elementsChain);
  return {
    chainFallback: true,
    blockIds: chain.block_ids,
    target: {
      block_id: chain.block_id,
      block_type: null,
      row: chain.row,
      column: chain.column,
      text_token: textToken,
      nth: null,
      option: chain.option,
    },
  };
}

function hasTarget({ target }) {
  return !type.isNone(target.block_id) || !type.isNone(target.text_token);
}

function buildFailureEvent({ values }) {
  return {
    name: values.eventName,
    block_id: values.blockId,
    success: false,
    error: {
      name: values.errorName ?? 'Error',
      action_type: values.actionType,
      config_key: values.configKey,
      action_id: values.actionId,
    },
    invalid_blocks: values.invalidBlocks ?? [],
  };
}

function interactionKind({ values }) {
  if (values.event === '$autocapture') return INTERACTION_KINDS[values.eventType];
  if (!type.isUndefined(FRUSTRATIONS[values.event])) return 'click';
  return undefined;
}

// One PostHog row as one production trace record (schema v1), or what the
// day assembly needs to finish it: a frustration to attach to a click, or a
// failure to pair with the interaction that caused it. Ids are hashed, query
// values and the elements chain are dropped, and a record that is not a
// failure leaves `event` out, because production cannot see an event succeed.
function postHogRowToRecord({ row, salt }) {
  const values = normalisePostHogRow({ row });
  if (type.isNone(values.time)) return { dropped: 'no_timestamp' };
  if (type.isNone(values.sessionId)) return { dropped: 'no_session' };

  const isPageEvent = values.event === '$pageview' || values.event === '$pageleave';
  const isFailure = values.event === 'lowdefy_event_failed';
  const kind = interactionKind({ values });
  if (!isPageEvent && !isFailure && type.isUndefined(kind)) {
    return { dropped: values.event === '$autocapture' ? 'event_type' : 'event' };
  }

  const pathname = pathnameOf({ values });
  const page = resolvePage({ values, pathname });
  if (type.isUndefined(page.pageId)) {
    return { dropped: values.event === '$pageview' ? page.reason : 'no_page' };
  }

  const base = {
    v: 1,
    source: 'production',
    session: type.isNone(values.windowId)
      ? values.sessionId
      : `${values.sessionId}.${values.windowId}`,
    person: hashId({ salt, id: values.personId, prefix: 'p_' }),
    org: hashId({ salt, id: values.orgId, prefix: 'o_' }),
    roles: values.roles,
    t: new Date(values.time).toISOString(),
    build: values.buildId,
    page_id: page.pageId,
    scope: 'page',
  };
  const url = urlWithQueryNames({ currentUrl: values.currentUrl, pathname });

  if (isPageEvent) {
    const record = {
      ...base,
      kind: values.event === '$pageview' ? 'pageview' : 'pageleave',
      url: url ?? `/${page.pageId}`,
      target: null,
    };
    return { record, id: values.uuid };
  }

  if (isFailure) {
    if (type.isNone(values.eventName) || type.isNone(values.blockId)) {
      return { dropped: 'failure_without_block' };
    }
    const scope = SCOPES.includes(values.eventScope) ? values.eventScope : 'page';
    const record = { ...base, scope, kind: 'engine', target: null };
    if (!type.isNone(url)) record.url = url;
    record.event = buildFailureEvent({ values });
    return {
      failure: record,
      id: values.uuid,
      pairing: {
        blockId: values.blockId,
        eventName: values.eventName,
        startTimestamp: values.time,
        debounceMs: values.debounceMs,
        scope,
      },
    };
  }

  const { target, blockIds, chainFallback } = resolveTarget({ values, salt });
  if (!hasTarget({ target })) return { dropped: 'no_target' };
  const record = { ...base, kind };
  if (!type.isNone(url)) record.url = url;
  record.target = target;
  const frustration = FRUSTRATIONS[values.event];
  if (!type.isUndefined(frustration)) {
    record.frustration = frustration;
    return { frustration: record, id: values.uuid, blockIds, chainFallback };
  }
  return { record, id: values.uuid, blockIds, chainFallback };
}

export default postHogRowToRecord;
