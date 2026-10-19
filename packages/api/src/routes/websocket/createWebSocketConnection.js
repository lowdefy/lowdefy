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
import { runInCredentialScope } from '@lowdefy/node-utils';

import getCallerFingerprint from './getCallerFingerprint.js';
import redactErrorResponse from '../../response/redactErrorResponse.js';
import resolveWebsocketCaller from './resolveWebsocketCaller.js';

const CALLER_CHECK_INTERVAL_MS = 60 * 1000;
const CALLER_CHANGED_CODE = 4401;
const CALLER_CHECK_FAILED_CODE = 1011;

// Wraps one client websocket connection: parses frames, dispatches
// subscribe/unsubscribe/publish to the channel registry, and answers every
// frame with an ack or an error so client actions never hang.
//
// The context, and the caller on it, is the upgrade request's. A socket can
// stay open long after that request, so the caller is resolved again from the
// upgrade's headers before every subscribe and once a minute. When it signed
// out, lost its membership, changed roles or switched organization, the socket
// closes with code 4401; the client reconnects, which authenticates afresh.
// Each check is a live session read - nothing is cached, so a revoked session
// closes the socket within a minute.
function createWebSocketConnection(context, { closeSocket, headers, registry, send, strategies }) {
  const { logger } = context;
  const callerFingerprint = getCallerFingerprint({ user: context.user });
  // websocketId → the tail of that feed's frame queue. A feed's frames are
  // handled one at a time, in the order they arrive. A subscribe awaits its
  // channel preparation, so without this an unsubscribe sent right after it
  // would run first, find nothing to remove, and leave the subscription
  // running for a client that no longer wants it. Feeds have separate queues,
  // so a slow publish routine on one feed does not hold up the others.
  const feedQueues = new Map();
  let closed = false;
  const subscriber = {
    id: context.rid,
    subscriptions: new Map(),
    send,
    // A shared channel broadcasts to every subscriber, so each one carries its
    // own locale for the error message it is sent.
    i18n: context.i18n,
  };

  function sendError({ message, requestId, websocketId }) {
    send(JSON.stringify({ type: 'error', websocketId, requestId, message }));
  }

  function sendErrorPayload({ error, requestId, websocketId }) {
    send(
      JSON.stringify({
        type: 'error',
        websocketId,
        requestId,
        error: redactErrorResponse(context, error),
      })
    );
  }

  function close() {
    if (closed) {
      return;
    }
    closed = true;
    clearInterval(callerCheckTimer);
    registry.unsubscribeAll({ subscriber });
    // A subscribe still being prepared registers after this point.
    Promise.all(feedQueues.values())
      .then(() => registry.unsubscribeAll({ subscriber }))
      .catch((error) => context.handleError(error));
    logger.debug({ event: 'ws_disconnect' });
  }

  function closeWith({ code, reason }) {
    close();
    closeSocket({ code, reason });
  }

  // Returns true while the socket still acts for the caller it was opened with.
  // A check that can not complete closes the socket too: the caller can not be
  // vouched for, and the client's reconnect authenticates afresh.
  async function checkCaller() {
    let user;
    try {
      user = await resolveWebsocketCaller(context, { headers, strategies });
    } catch (error) {
      if (!closed) {
        context.handleError(error);
        closeWith({ code: CALLER_CHECK_FAILED_CODE, reason: 'caller-check-failed' });
      }
      return false;
    }
    if (closed) {
      return false;
    }
    if (getCallerFingerprint({ user }) !== callerFingerprint) {
      logger.info({ event: 'ws_caller_changed' }, 'WebSocket caller changed - closing.');
      closeWith({ code: CALLER_CHANGED_CODE, reason: 'caller-changed' });
      return false;
    }
    return true;
  }

  async function handleFrame(frame) {
    const { payload, requestId, websocketId } = frame;
    switch (frame.type) {
      case 'subscribe':
        if (!(await checkCaller())) {
          // The socket is closing; the client resubscribes on its next one.
          return;
        }
        await registry.subscribe(context, { websocketId, payload, subscriber });
        send(JSON.stringify({ type: 'subscribed', websocketId, requestId }));
        return;
      case 'unsubscribe':
        registry.unsubscribe({ websocketId, subscriber });
        send(JSON.stringify({ type: 'unsubscribed', websocketId }));
        return;
      case 'publish':
        await registry.publish(context, { websocketId, payload });
        send(JSON.stringify({ type: 'published', websocketId, requestId }));
        return;
      default:
        // Unknown frame types are ignored for forward compatibility.
        logger.debug({ event: 'ws_unknown_frame', frameType: frame.type });
    }
  }

  async function processFrame(frame) {
    if (closed) {
      return;
    }
    try {
      await handleFrame(frame);
    } catch (error) {
      logger.debug({ err: error }, error.message);
      // Authentication and authorization refusals are expected traffic - one
      // warn line, no error log or Sentry report, but the client is still told.
      if (
        ['AuthenticationError', 'AuthorizationError', 'TwoFactorEnrolmentRequiredError'].includes(
          error.name
        )
      ) {
        logger.warn({ event: 'ws_refused', frameType: frame.type }, error.message);
      } else {
        context.handleError(error);
      }
      sendErrorPayload({
        error,
        requestId: frame.requestId,
        websocketId: frame.websocketId,
      });
    }
  }

  function enqueue(websocketId, task) {
    const handled = (feedQueues.get(websocketId) ?? Promise.resolve()).then(task);
    const tail = handled.catch(() => {});
    feedQueues.set(websocketId, tail);
    tail.then(() => {
      if (feedQueues.get(websocketId) === tail) {
        feedQueues.delete(websocketId);
      }
    });
    return handled;
  }

  async function handleMessage(raw) {
    if (closed) {
      return;
    }
    let frame;
    try {
      frame = JSON.parse(raw);
    } catch (error) {
      sendError({ message: 'Invalid frame — expected JSON.' });
      return;
    }
    if (!type.isObject(frame)) {
      sendError({ message: 'Invalid frame — expected an object.' });
      return;
    }
    if (!type.isString(frame.websocketId)) {
      sendError({ message: 'Frame "websocketId" should be a string.', requestId: frame.requestId });
      return;
    }
    // A frame arrives outside any HTTP request, so it gets its own credential scope for the
    // routines it runs.
    await enqueue(frame.websocketId, () => runInCredentialScope(() => processFrame(frame)));
  }

  // One timer per connection, cleared by close. It does not keep the process
  // alive on its own.
  const callerCheckTimer = setInterval(checkCaller, CALLER_CHECK_INTERVAL_MS);
  callerCheckTimer.unref();

  logger.debug({ event: 'ws_connect' });

  return { close, handleMessage, subscriber };
}

export default createWebSocketConnection;
