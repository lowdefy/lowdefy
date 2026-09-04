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

import getPiiFieldNames from './getPiiFieldNames.js';
import logEvent from '../../log/logEvent.js';
import resolveEventPolicy from '../../log/resolveEventPolicy.js';
import validateJourneyBatch from './validateJourneyBatch.js';

const MAX_LIST = 100;

function truncate(list) {
  return type.isArray(list) ? list.slice(0, MAX_LIST) : [];
}

function dropPiiStateWrites({ pii, stateWrites }) {
  return truncate(stateWrites).filter((write) => {
    if (!type.isObject(write) || !type.isString(write.path)) return false;
    const field = write.path.split('.').pop();
    return !pii.has(field);
  });
}

// journey_event is the corpus, not a diagnostic. logEvent decides a wide
// event's level from logger.events, which governs the request, step and
// endpoint lines; journeys carry their own switch (logger.journeys.enabled),
// so the level is pinned to info here while the identity gate is left exactly
// as the app configured it.
function pinLevelToInfo(context) {
  const { logger } = context;
  return {
    ...context,
    logger: {
      debug: (...args) => logger.debug(...args),
      eventsConfig: { ...resolveEventPolicy(logger.eventsConfig), level: 'all' },
      info: (...args) => logger.info(...args),
    },
  };
}

// One `journey_event` wide event per recorded trace event. The browser sends
// no identity; the caller's user and organization are stamped here from the
// server's own context, and logEvent drops both unless logger.events.identity
// is on. app_version and git_sha are on every line through the logger's base.
async function logJourneyBatch(context, { batch, journeys }) {
  if (journeys?.enabled === false) {
    return { logged: 0, status: 'disabled' };
  }
  const validation = validateJourneyBatch(batch);
  if (validation.valid === false) {
    return { logged: 0, message: validation.message, status: 'invalid' };
  }

  const pii = await getPiiFieldNames(context);
  const eventContext = pinLevelToInfo(context);

  batch.events.forEach((event) => {
    logEvent({
      context: eventContext,
      event: 'journey_event',
      fields: {
        t: event.t ?? null,
        session_id: event.session_id,
        page_instance: event.page_instance ?? null,
        page_id: event.page_id,
        block_id: event.block_id,
        block_type: type.isString(event.block_type) ? event.block_type : null,
        event_name: event.event_name,
        success: event.success,
        config_key: event.error?.config_key ?? null,
        // Flat, not logEvent's `error`: that field takes a real Error and
        // pulls the line onto the error path. A recorded failure is a fact
        // about the journey, and the server already logged the error itself.
        error_name: event.error?.name ?? null,
        actions: truncate(event.actions),
        requests: truncate(event.requests),
        state_writes: dropPiiStateWrites({ pii, stateWrites: event.state_writes }),
        url_after: event.url_after ?? null,
        payload: event.payload ?? null,
        org: context.user?.organization_id,
      },
    });
  });

  return { logged: batch.events.length, status: 'ok' };
}

export default logJourneyBatch;
