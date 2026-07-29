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

import createChatBot from '../../lib/server/channels/createChatBot.js';

// Chat platform webhook receiver. The transport is public - trust is earned
// from the Chat SDK adapter's platform signature verification (e.g. the
// Telegram secret token), mirroring the api-webhook philosophy. Handlers run
// under the channel's service identity, never the session middleware.
async function webhooksHandler(c) {
  const bot = await createChatBot();
  if (!bot) {
    return c.json({ error: 'No channels configured.' }, 404);
  }
  const platform = c.req.param('platform');
  const webhookHandler = bot.webhooks[platform];
  if (!webhookHandler) {
    return c.json({ error: `Unknown platform "${platform}".` }, 404);
  }
  // Chat SDK takes the Web Request and returns a Web Response. Message
  // processing continues after the response - on serverless, waitUntil keeps
  // the invocation alive until the agent reply is posted; on long-lived
  // hosts the lookup resolves to nothing and the promise just runs.
  return webhookHandler(c.req.raw, {
    waitUntil: (task) =>
      globalThis[Symbol.for('@vercel/request-context')]?.get?.()?.waitUntil?.(task),
  });
}

export default webhooksHandler;
