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

import crypto from 'crypto';

import { callAgent } from '@lowdefy/api';
import { createPhaseLogger } from '@lowdefy/ai-utils';
import { type } from '@lowdefy/helpers';

import apiWrapper from '../../../lib/server/apiWrapper.js';

async function handler({ context, req, res }) {
  if (req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }
  const segments = req.query.path;
  if (!segments || segments.length < 2) {
    res.status(400).json({ error: 'Invalid agent path' });
    return;
  }
  const agentId = segments[segments.length - 1];
  const pageId = segments.slice(0, -1).join('/');
  context.logger.info({ color: 'gray' }, `Agent: ${pageId} → ${agentId}`);
  const { conversationId } = req.query;
  const { messages, urlQuery, sharedState, turnId: clientTurnId } = req.body;
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array' });
    return;
  }
  if (urlQuery != null && (typeof urlQuery !== 'object' || Array.isArray(urlQuery))) {
    res.status(400).json({ error: 'urlQuery must be an object' });
    return;
  }
  if (sharedState != null && !type.isObject(sharedState)) {
    res.status(400).json({ error: 'sharedState must be an object' });
    return;
  }

  const turnId =
    typeof clientTurnId === 'string' && clientTurnId ? clientTurnId : crypto.randomUUID();
  const turnStart = Date.now();
  const phaseLogger = createPhaseLogger({
    logger: context.logger,
    agentId,
    pageId,
    conversationId: conversationId ?? undefined,
    turnId,
    turnStart,
  });

  const bodySize = (() => {
    try {
      return Buffer.byteLength(JSON.stringify(req.body ?? ''));
    } catch {
      return -1;
    }
  })();
  const hasFiles = Array.isArray(messages)
    ? messages.some((m) => (m?.parts ?? []).some((p) => p?.type === 'file'))
    : false;
  phaseLogger.phase('ingress.received', {
    bodySize,
    messageCount: messages.length,
    hasFiles,
    sharedStateKeys: sharedState ? Object.keys(sharedState).length : 0,
    urlQueryKeys: urlQuery ? Object.keys(urlQuery).length : 0,
  });

  const { response: webResponse } = await callAgent(context, {
    agentId,
    pageId,
    messages,
    conversationId: conversationId ?? undefined,
    sharedState: sharedState ?? undefined,
    urlQuery: urlQuery ?? undefined,
    phaseLogger,
    turnId,
  });

  // Stream the Web Response body to the Next.js response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Encoding', 'none');
  res.setHeader('Transfer-Encoding', 'chunked');

  phaseLogger.phase('ingress.stream.forward.start');

  const reader = webResponse.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let firstByteLogged = false;
  let chunkCount = 0;
  let totalBytes = 0;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      if (!firstByteLogged) {
        firstByteLogged = true;
        phaseLogger.phase('ingress.stream.first_byte', { bytes: value.byteLength });
      }
      chunkCount += 1;
      totalBytes += value.byteLength;
      res.write(decoder.decode(value, { stream: true }));
    }
  }
  res.end();
  phaseLogger.phase('ingress.stream.forward.done', { chunkCount, totalBytes });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default apiWrapper(handler);
