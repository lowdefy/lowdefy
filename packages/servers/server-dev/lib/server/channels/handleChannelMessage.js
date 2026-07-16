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
  const startTime = performance.now();
  const context = createChannelContext({ channelConfig, platform });
  const { logger } = context;
  logger.info({ event: 'channel_message', platform, threadId: thread.id });

  // Subscribe so follow-up messages in the thread reach the bot without a
  // fresh mention.
  await thread.subscribe();

  // Thread history is the conversation memory - there is no server-side
  // conversation persistence. Fetched oldest-first per the Chat SDK contract.
  // Only history BEFORE the triggering message counts: the adapter cache may
  // lag or already include it, so cut at the message id instead of guessing.
  // Text comparison is not an identity check - repeated identical texts
  // ("Hi", "Hi") would otherwise drop the current message and the agent
  // answers the previous turn.
  let messages = [];
  try {
    const history = await thread.adapter.fetchMessages(thread.id, { limit: 20 });
    let platformMessages = history?.messages ?? [];
    const currentIndex = platformMessages.findIndex((msg) => msg.id === message.id);
    if (currentIndex !== -1) {
      platformMessages = platformMessages.slice(0, currentIndex);
    }
    messages = toUIMessages(platformMessages);
  } catch (error) {
    logger.warn({ event: 'channel_history_failed', err: error }, error.message);
  }

  // The triggering message is always the final user turn.
  messages.push({ role: 'user', parts: [{ type: 'text', text: message.text ?? '' }] });

  try {
    const { response: textStream } = await callAgent(context, {
      agentId: channelConfig.agentId,
      pageId: null,
      messages,
      conversationId: thread.id,
      format: 'stream',
    });
    // Drain the stream and post the complete reply once. Streaming into the
    // platform (draft previews / post+edit) hits chat rate limits and holds
    // the Chat SDK thread lock for the whole generation - new messages get
    // dropped while locked. The model finishes in seconds; one post is
    // faster in practice and releases the lock immediately.
    let reply = '';
    for await (const chunk of textStream) {
      reply += chunk;
    }
    // Platforms reject empty messages - a tool-only turn can produce no text.
    if (reply.trim().length > 0) {
      await thread.post(reply);
    }
    logger.info({
      event: 'channel_reply',
      platform,
      threadId: thread.id,
      durationMs: Math.round(performance.now() - startTime),
      replyLength: reply.length,
    });
  } catch (error) {
    await context.handleError(error);
    await thread.post(`Sorry, something went wrong: ${error.message}`);
  }
}

export default handleChannelMessage;
