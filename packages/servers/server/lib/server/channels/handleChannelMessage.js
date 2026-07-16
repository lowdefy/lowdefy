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

import createChannelContext from './createChannelContext.js';

// Maps chat platform messages to UIMessages - the bot's own messages become
// assistant turns so multi-turn context survives across webhook invocations.
function toUIMessages(platformMessages) {
  return platformMessages
    .filter((msg) => typeof msg.text === 'string' && msg.text.length > 0)
    .map((msg) => ({
      role: msg.author?.isMe === true ? 'assistant' : 'user',
      parts: [{ type: 'text', text: msg.text }],
    }));
}

async function handleChannelMessage({ channelConfig, message, platform, thread }) {
  const context = createChannelContext({ channelConfig, platform });
  const { logger } = context;
  logger.info({ event: 'channel_message', platform, threadId: thread.id });

  // Subscribe so follow-up messages in the thread reach the bot without a
  // fresh mention.
  await thread.subscribe();

  // Thread history is the conversation memory - there is no server-side
  // conversation persistence. Fetched oldest-first per the Chat SDK contract.
  let messages = [];
  try {
    const history = await thread.adapter.fetchMessages(thread.id, { limit: 20 });
    messages = toUIMessages(history?.messages ?? []);
  } catch (error) {
    logger.warn({ event: 'channel_history_failed', err: error }, error.message);
  }

  // The triggering message is usually the newest history entry - append it
  // only when history missed it (or history failed).
  const lastText = messages[messages.length - 1]?.parts?.[0]?.text;
  if (messages.length === 0 || lastText !== message.text) {
    messages.push({ role: 'user', parts: [{ type: 'text', text: message.text ?? '' }] });
  }

  try {
    const { response: textStream } = await callAgent(context, {
      agentId: channelConfig.agentId,
      pageId: null,
      messages,
      conversationId: thread.id,
      format: 'stream',
    });
    // Chat SDK accepts any AsyncIterable<string> and streams it to the thread.
    await thread.post(textStream);
  } catch (error) {
    await context.handleError(error);
    await thread.post(`Sorry, something went wrong: ${error.message}`);
  }
}

export default handleChannelMessage;
