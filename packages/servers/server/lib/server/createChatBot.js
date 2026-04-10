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

import { Chat } from 'chat';
import { createTelegramAdapter } from '@chat-adapter/telegram';
import { createMemoryState } from '@chat-adapter/state-memory';
import { callAgent, createApiContext, createAuthorize } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { serializer } from '@lowdefy/helpers';
import path from 'path';

import agents from '../../build/plugins/agents.js';
import config from '../build/config.js';
import connections from '../../build/plugins/connections.js';
import fileCache from './fileCache.js';
import operators from '../../build/plugins/operators/server.js';
import jsMap from '../../build/plugins/operators/serverJsMap.js';
import createLogger from './log/createLogger.js';

const secrets = getSecretsFromEnv();

const adapterFactories = {
  telegram: createTelegramAdapter,
};

let botInstance = null;

async function createChatBot() {
  if (botInstance) return botInstance;

  // Read channels config from build artifacts
  const channelsPath = path.join(process.cwd(), 'build', 'channels.json');
  let channelsConfig;
  try {
    const fs = await import('fs');
    const raw = fs.readFileSync(channelsPath, 'utf8');
    channelsConfig = serializer.deserialize(JSON.parse(raw));
  } catch {
    return null;
  }

  if (!channelsConfig || Object.keys(channelsConfig).length === 0) {
    return null;
  }

  const adapters = {};
  for (const platform of Object.keys(channelsConfig)) {
    const factory = adapterFactories[platform];
    if (factory) {
      adapters[platform] = factory();
    }
  }

  if (Object.keys(adapters).length === 0) {
    return null;
  }

  const bot = new Chat({
    userName: 'lowdefy',
    adapters,
    state: createMemoryState(),
  });

  // Register handlers for each channel
  bot.onNewMention(async (thread, message) => {
    await handleChannelMessage({ bot, channelsConfig, thread, message });
  });

  bot.onSubscribedMessage(async (thread, message) => {
    await handleChannelMessage({ bot, channelsConfig, thread, message });
  });

  await bot.initialize();
  botInstance = bot;
  return bot;
}

async function handleChannelMessage({ bot, channelsConfig, thread, message }) {
  // Determine which platform this thread belongs to
  const platform = thread.id.split(':')[0];
  const channelConfig = channelsConfig[platform];
  if (!channelConfig) return;

  // Subscribe to the thread for follow-up messages
  await thread.subscribe();

  // Build a minimal API context for callAgent
  const context = {
    agents,
    buildDirectory: path.join(process.cwd(), 'build'),
    config,
    connections,
    fileCache,
    jsMap,
    operators,
    secrets,
    logger: createLogger({ rid: `channel-${platform}` }),
    handleError: async (err) => {
      console.error(err);
    },
  };

  // Initialize API context (readConfigFile, authorize, etc.)
  createApiContext(context);

  // Build messages in AI SDK UIMessage format
  const messages = [];

  // Fetch thread history for multi-turn conversations
  try {
    const history = await thread.adapter.fetchMessages(thread.id, { limit: 20 });
    if (history?.messages) {
      for (const msg of history.messages) {
        messages.push({
          role: msg.authorIsBot ? 'assistant' : 'user',
          parts: [{ type: 'text', text: msg.text ?? '' }],
        });
      }
    }
  } catch {
    // No history available — just use the current message
  }

  // Add current message if not already in history
  if (messages.length === 0 || messages[messages.length - 1]?.parts?.[0]?.text !== message.text) {
    messages.push({
      role: 'user',
      parts: [{ type: 'text', text: message.text ?? '' }],
    });
  }

  try {
    const { response: fullStream } = await callAgent(context, {
      agentId: channelConfig.agentId,
      messages,
      format: 'stream',
    });

    await thread.post(fullStream);
  } catch (error) {
    context.logger.error(error);
    await thread.post(`Sorry, something went wrong: ${error.message}`);
  }
}

export default createChatBot;
