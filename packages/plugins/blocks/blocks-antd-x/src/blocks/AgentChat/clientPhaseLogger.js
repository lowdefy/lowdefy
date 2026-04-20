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

// Client-side phase logger for the AgentChat block.
// Off by default. Enable with either:
//   window.__LOWDEFY_AGENT_TRACE__ = true
//   localStorage.setItem('lowdefyAgentTrace', '1')
// Emits compact console.debug lines:
//   [agent] dt=123ms conv=… turn=… step=3 phase=client.transport.chunk type=tool-result

function isTraceEnabled() {
  if (typeof window === 'undefined') return false;
  if (window.__LOWDEFY_AGENT_TRACE__ === true) return true;
  try {
    return window.localStorage?.getItem('lowdefyAgentTrace') === '1';
  } catch {
    return false;
  }
}

function noopLogger() {
  return {
    phase: () => {},
    time: async (_name, fn) => fn(),
    setTurn: () => {},
    getTurnId: () => undefined,
  };
}

function fmt(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function createClientPhaseLogger({ agentId, pageId, conversationId } = {}) {
  if (!isTraceEnabled()) return noopLogger();

  const state = {
    turnId: undefined,
    turnStart: undefined,
    lastPhaseAt: undefined,
  };

  function emit(phase, data) {
    const now = Date.now();
    const dt = state.turnStart ? now - state.turnStart : 0;
    const dtPrev = state.lastPhaseAt ? now - state.lastPhaseAt : 0;
    state.lastPhaseAt = now;

    const ids = { agentId, pageId, conversationId, turnId: state.turnId };
    const parts = [`[agent] dt=${dt}ms dtPrev=${dtPrev}ms`];
    for (const [k, v] of Object.entries(ids)) {
      if (v !== undefined && v !== null) parts.push(`${k}=${fmt(v)}`);
    }
    parts.push(`phase=${phase}`);
    for (const [k, v] of Object.entries(data ?? {})) {
      parts.push(`${k}=${fmt(v)}`);
    }
    // eslint-disable-next-line no-console
    console.debug(parts.join(' '));
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
        err: err?.message,
      });
      throw err;
    }
  }

  function setTurn(turnId, turnStart) {
    state.turnId = turnId;
    state.turnStart = turnStart ?? Date.now();
    state.lastPhaseAt = state.turnStart;
  }

  function getTurnId() {
    return state.turnId;
  }

  return { phase: emit, time, setTurn, getTurnId };
}

export default createClientPhaseLogger;
