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

// Structured phase logger for the agent-chat lifecycle.
// Emits logger.debug({ event: 'agent_phase', phase, ...ids, t, dt, ...data })
// so a single conversation turn can be reconstructed by grepping on turnId.
// Off by default; enable with LOWDEFY_LOG_LEVEL=debug.

function noopLogger() {
  return {
    phase: () => {},
    time: async (_name, fn) => fn(),
    child: () => noopLogger(),
  };
}

function createPhaseLogger({
  logger,
  agentId,
  pageId,
  conversationId,
  turnId,
  turnStart,
  extra = {},
} = {}) {
  if (!logger || typeof logger.debug !== 'function') return noopLogger();

  const ids = { agentId, pageId, conversationId, turnId, ...extra };
  const start = turnStart ?? Date.now();

  function emit(phase, data) {
    const now = Date.now();
    // Caller data first, then protected keys last so they always win.
    logger.debug({
      ...ids,
      ...(data ?? {}),
      event: 'agent_phase',
      phase,
      t: new Date(now).toISOString(),
      dt: now - start,
    });
  }

  async function time(name, fn, data) {
    const t0 = Date.now();
    emit(`${name}.start`, data);
    try {
      const result = await fn();
      emit(`${name}.done`, { ...(data ?? {}), duration: Date.now() - t0 });
      return result;
    } catch (err) {
      emit(`${name}.error`, {
        ...(data ?? {}),
        duration: Date.now() - t0,
        err: { message: err?.message, name: err?.name },
      });
      throw err;
    }
  }

  function child(moreExtra) {
    return createPhaseLogger({
      logger,
      agentId,
      pageId,
      conversationId,
      turnId,
      turnStart: start,
      extra: { ...extra, ...moreExtra },
    });
  }

  return { phase: emit, time, child };
}

export default createPhaseLogger;
