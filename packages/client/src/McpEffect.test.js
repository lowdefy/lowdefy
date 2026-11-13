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

import React from 'react';
import { expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';

import McpEffect from './McpEffect.js';

function createMcp() {
  const listeners = new Set();
  return {
    listeners,
    onContextChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

test('McpEffect updates the context on mount and on every host context change', () => {
  const mcp = createMcp();
  const context = { _internal: { updateMcp: vi.fn() } };
  render(<McpEffect context={context} lowdefy={{ _internal: { mcp } }} />);
  expect(context._internal.updateMcp).toHaveBeenCalledTimes(1);
  mcp.listeners.forEach((listener) => listener());
  expect(context._internal.updateMcp).toHaveBeenCalledTimes(2);
});

test('McpEffect stops listening when the page unmounts', () => {
  const mcp = createMcp();
  const context = { _internal: { updateMcp: vi.fn() } };
  const { unmount } = render(<McpEffect context={context} lowdefy={{ _internal: { mcp } }} />);
  expect(mcp.listeners.size).toBe(1);
  unmount();
  expect(mcp.listeners.size).toBe(0);
});

test('McpEffect does nothing on a page that is not inside an MCP host', () => {
  const context = { _internal: { updateMcp: vi.fn() } };
  render(<McpEffect context={context} lowdefy={{ _internal: { mcp: null } }} />);
  expect(context._internal.updateMcp).not.toHaveBeenCalled();
});
