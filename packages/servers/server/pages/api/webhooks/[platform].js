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

import createChatBot from '../../../lib/server/createChatBot.js';

export default async function handler(req, res) {
  const bot = await createChatBot();
  if (!bot) {
    res.status(404).json({ error: 'No channels configured' });
    return;
  }

  const { platform } = req.query;
  const webhookHandler = bot.webhooks[platform];
  if (!webhookHandler) {
    res.status(404).json({ error: `Unknown platform: ${platform}` });
    return;
  }

  // Convert Next.js req/res to a Web Request for Chat SDK
  const protocol = req.headers['x-forwarded-proto'] ?? 'https';
  const host = req.headers.host;
  const url = `${protocol}://${host}${req.url}`;

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const webRequest = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: req.method !== 'GET' ? body : undefined,
  });

  // Chat SDK returns a Web Response
  const webResponse = await webhookHandler(webRequest, {
    waitUntil: (task) => {
      // In serverless, ensure the task completes before the function exits.
      // Next.js Pages Router doesn't have waitUntil, so we just fire the promise.
      task.catch((err) => console.error('Webhook background task failed:', err));
    },
  });

  // Convert Web Response back to Next.js res
  res.status(webResponse.status);
  for (const [key, value] of webResponse.headers.entries()) {
    res.setHeader(key, value);
  }
  const responseBody = await webResponse.text();
  res.send(responseBody);
}
