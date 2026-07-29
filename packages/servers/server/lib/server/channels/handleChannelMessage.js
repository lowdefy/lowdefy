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

// Attachment media the agent pipeline can consume - documents and video are
// intentionally excluded.
const SUPPORTED_ATTACHMENT_TYPES = ['audio', 'image'];

// Telegram photos carry no mime_type - the platform re-encodes every photo as
// JPEG, so image attachments without one default to image/jpeg.
function attachmentMediaType(attachment) {
  if (typeof attachment.mimeType === 'string') return attachment.mimeType;
  if (attachment.type === 'image') return 'image/jpeg';
  return null;
}

function supportedAttachments(attachments) {
  return (attachments ?? []).filter(
    (attachment) =>
      SUPPORTED_ATTACHMENT_TYPES.includes(attachment.type) &&
      attachmentMediaType(attachment) !== null
  );
}

// Download the triggering message's media and build UIMessage file parts.
// Data URLs match the AgentChat block's file part shape - ai-utils'
// convertDataUrlsToBase64 strips the prefix before the AI SDK sees them.
async function toAttachmentFileParts(attachments) {
  const parts = [];
  for (const attachment of supportedAttachments(attachments)) {
    const buffer =
      attachment.data ??
      (typeof attachment.fetchData === 'function' ? await attachment.fetchData() : null);
    if (!buffer) continue;
    const mediaType = attachmentMediaType(attachment);
    parts.push({
      type: 'file',
      url: `data:${mediaType};base64,${Buffer.from(buffer).toString('base64')}`,
      mediaType,
      ...(attachment.name ? { filename: attachment.name } : {}),
    });
  }
  return parts;
}

// Maps chat platform messages to UIMessages - the bot's own messages become
// assistant turns so multi-turn context survives across webhook invocations.
// History media becomes text placeholders instead of real file parts:
// re-downloading (and re-transcribing) up to 20 history attachments on every
// request is unbounded cost, and the assistant's prior replies already carry
// the semantics. Only the triggering message gets real media.
function toUIMessages(platformMessages) {
  return platformMessages
    .map((msg) => {
      const text = typeof msg.text === 'string' ? msg.text : '';
      const placeholders = supportedAttachments(msg.attachments).map((attachment) =>
        attachment.type === 'audio' ? '[voice message]' : '[image]'
      );
      const fullText = [text, ...placeholders].filter((part) => part.length > 0).join('\n');
      if (fullText.length === 0) return null;
      return {
        role: msg.author?.isMe === true ? 'assistant' : 'user',
        parts: [{ type: 'text', text: fullText }],
      };
    })
    .filter((msg) => msg !== null);
}

// The model can legitimately end a turn with only tool calls and no closing
// text. Chat platforms reject empty messages (Telegram's adapter throws), so
// yield a short fallback when the stream drains without any visible text.
async function* withTextFallback(textStream) {
  let hasText = false;
  for await (const chunk of textStream) {
    if (!hasText && chunk.trim().length > 0) {
      hasText = true;
    }
    yield chunk;
  }
  if (!hasText) {
    yield 'Done.';
  }
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

  try {
    // The triggering message is always the final user turn - text plus any
    // supported media as file parts. Built inside the try so a failed
    // Telegram media download posts the error to the chat instead of
    // crashing the webhook.
    const parts = [];
    if (typeof message.text === 'string' && message.text.length > 0) {
      parts.push({ type: 'text', text: message.text });
    }
    parts.push(...(await toAttachmentFileParts(message.attachments)));
    if (parts.length === 0) {
      // A message with only unsupported attachments (documents, video,
      // stickers) still needs content - providers reject empty user messages.
      parts.push({ type: 'text', text: '[unsupported attachment]' });
    }
    messages.push({ role: 'user', parts });

    const agentStart = performance.now();
    const { response: textStream } = await callAgent(context, {
      agentId: channelConfig.agentId,
      pageId: null,
      messages,
      conversationId: thread.id,
      format: 'stream',
    });
    const agentMs = Math.round(performance.now() - agentStart);
    const postStart = performance.now();
    // Stream the reply into the thread - Telegram DMs render it as a live
    // draft preview, other platforms fall back to post+edit or buffering.
    // (Concurrent platform calls during a polling long-poll require the
    // HTTP/1.1 dispatcher swap in disableFetchHttp2.js.)
    await thread.post(withTextFallback(textStream));
    logger.info({
      event: 'channel_reply',
      platform,
      threadId: thread.id,
      durationMs: Math.round(performance.now() - startTime),
      agentMs,
      postMs: Math.round(performance.now() - postStart),
    });
  } catch (error) {
    await context.handleError(error);
    await thread.post(`Sorry, something went wrong: ${error.message}`);
  }
}

export default handleChannelMessage;
