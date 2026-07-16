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

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Chat } from 'chat';
import { createMemoryState } from '@chat-adapter/state-memory';
import { createTelegramAdapter } from '@chat-adapter/telegram';
import { serializer } from '@lowdefy/helpers';

import handleChannelMessage from './handleChannelMessage.js';

// Adding a platform = adding an adapter factory here (plus its schema entry).
// Adapters read their credentials from env (e.g. TELEGRAM_BOT_TOKEN).
const adapterFactories = {
  telegram: (options) => createTelegramAdapter(options),
};

const markerKeys = ['~ignoreBuildChecks', '~r', '~l', '~k', 'configured'];

// Vite dev-server module reloads must not spawn duplicate polling clients -
// the singleton lives on globalThis, surviving module re-evaluation.
const BOT_KEY = Symbol.for('lowdefy.channelBot');
const ADAPTERS_KEY = Symbol.for('lowdefy.channelBotAdapters');

// Process-lifetime Chat SDK bot over the configured channels - a module-scope
// singleton like the websocket channel registry. Returns null when no
// channels are configured. mode 'webhook' (production default) handles
// updates via POST /api/webhooks/{platform}; mode 'polling' (dev) pulls
// updates without a public URL.
async function createChatBot({ logger, mode = 'webhook' } = {}) {
  if (globalThis[BOT_KEY] !== undefined) {
    return globalThis[BOT_KEY];
  }

  const channelsConfig = serializer.deserialize(
    JSON.parse(readFileSync(path.join(process.cwd(), 'build', 'channels.json'), 'utf8'))
  );
  if (channelsConfig.configured !== true) {
    globalThis[BOT_KEY] = null;
    return globalThis[BOT_KEY];
  }

  const platforms = Object.keys(channelsConfig).filter((key) => !markerKeys.includes(key));
  const adapters = {};
  for (const platform of platforms) {
    const factory = adapterFactories[platform];
    adapters[platform] = factory(mode === 'polling' ? { mode: 'polling' } : {});
  }

  const bot = new Chat({
    userName: 'lowdefy',
    adapters,
    state: createMemoryState(),
    logger: 'warn',
  });

  function onMessage(thread, message) {
    const platform = thread.id.split(':')[0];
    const channelConfig = channelsConfig[platform];
    if (!channelConfig) return;
    return handleChannelMessage({ channelConfig, message, platform, thread });
  }

  bot.onNewMention(onMessage);
  bot.onSubscribedMessage(onMessage);

  await bot.initialize();
  if (mode === 'polling') {
    for (const adapter of Object.values(adapters)) {
      if (typeof adapter.startPolling === 'function') {
        await adapter.startPolling();
      }
    }
  }

  logger?.info({ event: 'channel_bot_started', platforms, mode });
  globalThis[ADAPTERS_KEY] = adapters;
  globalThis[BOT_KEY] = bot;
  return globalThis[BOT_KEY];
}

// Stops polling adapters on shutdown; webhook mode has nothing to stop.
async function stopChatBot() {
  for (const adapter of Object.values(globalThis[ADAPTERS_KEY] ?? {})) {
    if (typeof adapter.stopPolling === 'function') {
      await adapter.stopPolling().catch(() => {});
    }
  }
}

export { stopChatBot };
export default createChatBot;
