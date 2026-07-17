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

import { createHash } from 'node:crypto';

import { experimental_transcribe } from 'ai';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// Module-scope transcript cache: ui-message clients resend the full history
// with the original audio parts every turn, so without this every prior voice
// message would be re-transcribed on every turn. Keyed by content hash and
// FIFO-capped; a cold start resets it - the cost is a re-transcription, not a
// correctness issue.
const transcriptCache = new Map();
const MAX_CACHE_ENTRIES = 50;

function isAudioFilePart(part) {
  return part.type === 'file' && (part.mediaType ?? '').startsWith('audio/');
}

function hasAudioFileParts(messages) {
  return messages.some(
    (msg) => msg.role === 'user' && (msg.parts ?? []).some((part) => isAudioFilePart(part))
  );
}

async function transcribeAudioPart({ part, model, providerOptions }) {
  // Callers run convertDataUrlsToBase64 first, so url is raw base64 unless it
  // is a remote http(s) URL, which the AI SDK downloads itself.
  const cacheKey = createHash('sha256').update(part.url).digest('hex');
  if (transcriptCache.has(cacheKey)) {
    return transcriptCache.get(cacheKey);
  }
  const audio = part.url.startsWith('http') ? new URL(part.url) : part.url;
  const { text } = await experimental_transcribe({
    model,
    audio,
    ...(providerOptions ? { providerOptions } : {}),
  });
  transcriptCache.set(cacheKey, text);
  if (transcriptCache.size > MAX_CACHE_ENTRIES) {
    transcriptCache.delete(transcriptCache.keys().next().value);
  }
  return text;
}

// Replaces audio file parts in user messages with their transcript as text
// parts, so any chat model can respond to voice input. Replacement (rather
// than keeping the audio alongside) matters: providers without native audio
// support reject requests containing audio parts. Without transcription
// config, audio passes through untouched for models with native audio
// support (e.g. Gemini).
async function transcribeAudioParts({ agent, messages, context }) {
  const transcription = agent.properties?.transcription;
  if (type.isNone(transcription)) {
    return messages;
  }
  if (!hasAudioFileParts(messages)) {
    return messages;
  }

  const connection = await context.getConnectionForAgent({
    agentConfig: { connectionId: transcription.connectionId, '~k': agent['~k'] },
  });
  if (typeof connection.provider?.transcription !== 'function') {
    throw new ConfigError(
      `Agent "${agent.agentId}" transcription connection "${transcription.connectionId}" uses a provider that does not support transcription. Use a connection whose provider supports transcription models, like OpenAI or AIGateway.`,
      { configKey: agent['~k'] }
    );
  }
  const model = connection.provider.transcription(transcription.model);

  return Promise.all(
    messages.map(async (msg) => {
      if (msg.role !== 'user' || !(msg.parts ?? []).some((part) => isAudioFilePart(part))) {
        return msg;
      }
      const parts = await Promise.all(
        msg.parts.map(async (part) => {
          if (!isAudioFilePart(part)) {
            return part;
          }
          try {
            const text = await transcribeAudioPart({
              part,
              model,
              providerOptions: transcription.providerOptions,
            });
            return { type: 'text', text };
          } catch (error) {
            throw new Error(`Transcription failed for agent "${agent.agentId}": ${error.message}`, {
              cause: error,
            });
          }
        })
      );
      return { ...msg, parts };
    })
  );
}

export default transcribeAudioParts;
