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

import { callAgent, verifyJwt } from '@lowdefy/api';

import apiWrapper from '../../../lib/server/apiWrapper.js';

async function handler({ context, req, res }) {
  if (req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
  }

  const { agentId } = req.query;
  const { messages } = req.body;

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'messages must be an array' });
    return;
  }

  // Load agent config — externalApi computed at build from auth.agents
  const agentConfig = await context.readConfigFile(`agents/${agentId}.json`);
  if (!agentConfig?.externalApi?.enabled) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  // Authenticate via JWT when not public
  if (!agentConfig.externalApi.auth.public) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    try {
      const authConfig = await context.readConfigFile('auth.json');
      const user = await verifyJwt(token, authConfig.config.jwt);

      // Check roles if required
      if (agentConfig.externalApi.auth.roles) {
        const userRoles = user.roles ?? [];
        const hasRole = agentConfig.externalApi.auth.roles.some((r) => userRoles.includes(r));
        if (!hasRole) {
          res.status(404).json({ error: 'Agent not found' });
          return;
        }
      }

      context.user = user;
    } catch {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
  }

  // Select stream format from Accept header
  const accept = req.headers.accept ?? '';
  const format = accept.includes('text/event-stream') ? 'ui-message' : 'text';

  context.logger.info({ color: 'gray' }, `Agent (external): ${agentId} [${format}]`);

  const { response: webResponse } = await callAgent(context, {
    agentId,
    messages,
    format,
  });

  // Stream the response
  const contentType = format === 'text' ? 'text/plain; charset=utf-8' : 'text/event-stream';
  res.setHeader('Content-Type', contentType);
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
