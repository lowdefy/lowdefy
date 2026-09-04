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
import { loadAndResolveErrorLocation } from '@lowdefy/errors';

import devNoticeStore from './devNoticeStore.js';

async function recordDevNotice({ context, notice }) {
  const location = await loadAndResolveErrorLocation({
    error: notice,
    readConfigFile: context.readConfigFile,
    configDirectory: context.configDirectory,
  });
  const entry = {
    timestamp: new Date().toISOString(),
    name: notice.name,
    level: notice.level ?? 'info',
    message: notice.message,
    source: location?.source ?? null,
    config: location?.config ?? null,
    details: notice.details ?? null,
    configKey: notice.configKey ?? null,
  };
  // The store dedupes by configKey and publishes a dev_notice event on
  // devEventBus for every entry it stores, so the dev tabs count config sites
  // rather than executions. Nothing to do here beyond building the entry.
  devNoticeStore.push(entry);
}

// The dev-only implementation of context.handleDevNotice (see
// createApiContext in @lowdefy/api). Location resolution reads keyMap.json
// and refMap.json, which is async, while the routes that raise notices
// (resolveTenant) are synchronous and on the request path - so the work is
// started and the call returns immediately. Every failure is swallowed: a
// notice must never fail a request.
function createHandleDevNotice({ context }) {
  return function handleDevNotice(notice) {
    try {
      void recordDevNotice({ context, notice }).catch(() => {});
    } catch {
      // recordDevNotice is async so this only guards a synchronous throw from
      // a malformed call; nothing to do but keep the request alive.
    }
  };
}

export default createHandleDevNotice;
