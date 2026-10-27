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

import { expect, test, vi } from 'vitest';

import reportDevToolFault from './reportDevToolFault.js';

test('reportDevToolFault logs the error with its stack and names the tool as at fault', () => {
  const logger = { error: vi.fn() };
  const error = new TypeError("Cannot read properties of undefined (reading 'page')");

  const text = reportDevToolFault({ error, logger, tool: 'lowdefy_run_journey' });

  expect(logger.error).toHaveBeenCalledWith(
    { err: error, event: 'dev_tool_fault', tool: 'lowdefy_run_journey' },
    'The lowdefy_run_journey dev tool failed.'
  );
  expect(text).toBe(
    "TypeError: Cannot read properties of undefined (reading 'page') (a fault in the dev server's lowdefy_run_journey tool, not in the app; the dev server terminal has the stack)"
  );
});
