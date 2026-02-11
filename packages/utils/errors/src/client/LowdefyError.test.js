/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { jest } from '@jest/globals';
import LowdefyError from './LowdefyError.js';
import BaseLowdefyError from '../LowdefyError.js';

beforeEach(() => {
  jest.restoreAllMocks();
});

test('client LowdefyError extends base LowdefyError', () => {
  const error = new LowdefyError('Test error');
  expect(error instanceof BaseLowdefyError).toBe(true);
  expect(error instanceof Error).toBe(true);
  expect(error.name).toBe('LowdefyError');
});

describe('log', () => {
  test('log sends error to server and logs to console', async () => {
    global.fetch = jest.fn().mockResolvedValue({});
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new LowdefyError('Server log test');
    await error.log({ basePath: '/app' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/app/api/client-error',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      })
    );

    const callArgs = global.fetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body['~err']).toBe('LowdefyError');
    expect(body.message).toBe('Server log test');

    expect(consoleSpy).toHaveBeenCalledWith(error.print());
  });

  test('log uses empty string basePath when lowdefy is undefined', async () => {
    global.fetch = jest.fn().mockResolvedValue({});
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new LowdefyError('No lowdefy');
    await error.log();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/client-error',
      expect.any(Object)
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('log uses empty string basePath when lowdefy.basePath is undefined', async () => {
    global.fetch = jest.fn().mockResolvedValue({});
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new LowdefyError('Missing basePath');
    await error.log({});

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/client-error',
      expect.any(Object)
    );
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('log handles fetch error and still logs to console', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new LowdefyError('Fetch failed');
    await error.log({ basePath: '' });

    expect(consoleSpy).toHaveBeenCalledWith(error.print());
  });

  test('log console output includes formatted message', async () => {
    global.fetch = jest.fn().mockResolvedValue({});
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new LowdefyError('Something broke');
    await error.log({ basePath: '' });

    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('[LowdefyError] Something broke');
  });
});

describe('deserialize', () => {
  test('deserialize creates client LowdefyError from data', () => {
    const data = { message: 'Deserialized error' };
    const error = LowdefyError.deserialize(data);

    expect(error instanceof LowdefyError).toBe(true);
    expect(error instanceof BaseLowdefyError).toBe(true);
    expect(error.message).toBe('Deserialized error');
    expect(error.name).toBe('LowdefyError');
  });
});
