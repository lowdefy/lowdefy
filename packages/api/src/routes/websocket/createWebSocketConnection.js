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

// Wraps one client websocket connection: parses frames, dispatches
// subscribe/unsubscribe/publish to the channel registry, and answers every
// frame with an ack or an error so client actions never hang.
function createWebSocketConnection(context, { registry, send }) {
  const { logger } = context;
  const subscriber = {
    id: context.rid,
    subscriptions: new Map(),
    send,
  };

  function sendError({ message, requestId, websocketId }) {
    send(JSON.stringify({ type: 'error', websocketId, requestId, message }));
  }

  async function handleFrame(frame) {
    const { payload, requestId, websocketId } = frame;
    if (!type.isString(websocketId)) {
      sendError({ message: 'Frame "websocketId" should be a string.', requestId });
      return;
    }
    switch (frame.type) {
      case 'subscribe':
        await registry.subscribe(context, { websocketId, payload, subscriber });
        send(JSON.stringify({ type: 'subscribed', websocketId }));
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

  async function handleMessage(raw) {
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
    try {
      await handleFrame(frame);
    } catch (error) {
      logger.debug({ err: error }, error.message);
      context.handleError(error);
      sendError({
        message: error.message,
        requestId: frame.requestId,
        websocketId: frame.websocketId,
      });
    }
  }

  function close() {
    registry.unsubscribeAll({ subscriber });
    logger.debug({ event: 'ws_disconnect' });
  }

  logger.debug({ event: 'ws_connect' });

  return { close, handleMessage, subscriber };
}

export default createWebSocketConnection;
