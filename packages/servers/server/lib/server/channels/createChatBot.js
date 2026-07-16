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

import disableFetchHttp2 from './disableFetchHttp2.js';
import handleChannelMessage from './handleChannelMessage.js';

// Adding a platform = adding an adapter factory here (plus its schema entry).
// Adapters read their credentials from env (e.g. TELEGRAM_BOT_TOKEN).
const adapterFactories = {
  telegram: (options) => createTelegramAdapter(options),
};

const markerKeys = ['~ignoreBuildChecks', '~r', '~l', '~k', 'configured'];

let botInstance;
let botAdapters = {};

// Process-lifetime Chat SDK bot over the configured channels - a module-scope
// singleton like the websocket channel registry. Returns null when no
// channels are configured. mode 'webhook' (production default) handles
// updates via POST /api/webhooks/{platform}; mode 'polling' (dev) pulls
// updates without a public URL.
async function createChatBot({ logger, mode = 'webhook' } = {}) {
  if (botInstance !== undefined) {
    return botInstance;
  }

  const channelsConfig = serializer.deserialize(
    JSON.parse(readFileSync(path.join(process.cwd(), 'build', 'channels.json'), 'utf8'))
  );
  if (channelsConfig.configured !== true) {
    botInstance = null;
    return botInstance;
  }

  const platforms = Object.keys(channelsConfig).filter((key) => !markerKeys.includes(key));
  const adapters = {};
  for (const platform of platforms) {
    const factory = adapterFactories[platform];
    adapters[platform] = factory(mode === 'polling' ? { mode: 'polling' } : {});
  }

  // Polling only - the H2 serialization needs a held long-poll to bite, and
  // webhook mode (serverless) has none. See disableFetchHttp2.js.
  if (mode === 'polling') {
    await disableFetchHttp2({ logger });
  }

  const bot = new Chat({
    userName: 'lowdefy',
    adapters,
    state: createMemoryState(),
    logger: 'warn',
    // The default 'drop' strategy discards messages that arrive while the
    // per-thread lock is held (i.e. while a reply is being generated) -
    // queue processes them in order instead.
    concurrency: 'queue',
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
  botAdapters = adapters;
  botInstance = bot;
  return botInstance;
}

// Stops polling adapters on shutdown; webhook mode has nothing to stop.
async function stopChatBot() {
  for (const adapter of Object.values(botAdapters)) {
    if (typeof adapter.stopPolling === 'function') {
      await adapter.stopPolling().catch(() => {});
    }
  }
}

export { stopChatBot };
export default createChatBot;
