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
import { translate, type } from '@lowdefy/helpers';

import getPathSegments from '../lib/getPathSegments.js';

// Pageless agent route for external callers - no pageId, authentication via
// session or auth.strategies (jwt/apiKey), per-agent authorization inside
// callAgent. The Accept header selects the response representation: the
// UIMessage SSE protocol for chat clients, a plain text stream otherwise.
async function agentsHandler(c) {
  const context = c.get('lowdefyContext');
  const t = (key, values) => translate({ key, values, i18n: context.i18n });
  if (c.req.method !== 'POST') {
    throw new Error(t('agent.runtime.methodNotAllowed'));
  }
  const segments = getPathSegments(c, '/api/agents/');
  if (segments.length < 1) {
    return c.json({ error: t('agent.runtime.invalidPath') }, 400);
  }
  // Module-scoped agent ids contain slashes - the full remainder is the id.
  const agentId = segments.join('/');
  const { conversationId } = c.req.query();
  const { messages, urlQuery, sharedState } = await c.req.json();
  if (!Array.isArray(messages)) {
    return c.json({ error: t('agent.runtime.messagesMustBeArray') }, 400);
  }
  if (urlQuery != null && (typeof urlQuery !== 'object' || Array.isArray(urlQuery))) {
    return c.json({ error: t('agent.runtime.urlQueryMustBeObject') }, 400);
  }
  if (sharedState != null && !type.isObject(sharedState)) {
    return c.json({ error: t('agent.runtime.sharedStateMustBeObject') }, 400);
  }

  const accept = c.req.header('accept') ?? '';
  const format = accept.includes('text/event-stream') ? 'ui-message' : 'text';

  context.logger.info({ event: 'call_agent_external', agentId, format });

  const { response: webResponse } = await callAgent(context, {
    agentId,
    pageId: null,
    messages,
    conversationId: conversationId ?? undefined,
    sharedState: sharedState ?? undefined,
    urlQuery: urlQuery ?? undefined,
    format,
  });

  if (format === 'text') {
    return c.body(webResponse.body, 200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Content-Encoding': 'none',
    });
  }

  // callAgent returns a Web Response — stream its body straight through.
  return c.body(webResponse.body, 200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Encoding': 'none',
  });
}

export default agentsHandler;
