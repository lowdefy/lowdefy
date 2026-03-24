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

import { callAgent } from '@lowdefy/api';

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
  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array' });
    return;
  }
  const webResponse = await callAgent(context, { agentId, pageId, messages });

  // Stream the Web Response body to the Next.js response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Encoding', 'none');
  res.setHeader('Transfer-Encoding', 'chunked');

  const reader = webResponse.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      res.write(decoder.decode(value, { stream: true }));
    }
  }
  res.end();
}

export default apiWrapper(handler);
