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

import { expect, test } from 'vitest';

import buildTitleCallSettings from './buildTitleCallSettings.js';

test('buildTitleCallSettings asks for no reasoning with room for models that cannot skip it', () => {
  expect(buildTitleCallSettings({})).toEqual({
    maxOutputTokens: 1024,
    providerOptions: undefined,
    reasoning: 'none',
    timeout: undefined,
  });
});

test('buildTitleCallSettings removes thinking and reasoning settings and keeps the rest', () => {
  const providerOptions = {
    anthropic: { thinking: { type: 'adaptive' }, effort: 'high', sendReasoning: false },
    openai: { reasoningEffort: 'minimal', reasoningSummary: 'auto', store: false, user: 'u1' },
    google: { thinkingConfig: { thinkingLevel: 'high' }, safetySettings: [], threshold: 'OFF' },
    gateway: { zeroDataRetention: true, only: ['anthropic'], order: ['anthropic'] },
  };

  const { providerOptions: titleProviderOptions } = buildTitleCallSettings({ providerOptions });

  expect(titleProviderOptions).toEqual({
    anthropic: { sendReasoning: false },
    openai: { store: false, user: 'u1' },
    google: { safetySettings: [], threshold: 'OFF' },
    gateway: { zeroDataRetention: true, only: ['anthropic'], order: ['anthropic'] },
  });
});

test('buildTitleCallSettings does not change the agent providerOptions', () => {
  const providerOptions = { anthropic: { thinking: { type: 'adaptive' } } };

  buildTitleCallSettings({ providerOptions });

  expect(providerOptions).toEqual({ anthropic: { thinking: { type: 'adaptive' } } });
});

test('buildTitleCallSettings keeps provider keys it has no reasoning settings for', () => {
  const providerOptions = { mistral: { safePrompt: true } };

  expect(buildTitleCallSettings({ providerOptions }).providerOptions).toEqual({
    mistral: { safePrompt: true },
  });
});

test('buildTitleCallSettings passes a number timeout through', () => {
  expect(buildTitleCallSettings({ timeout: 30000 }).timeout).toBe(30000);
});

test('buildTitleCallSettings keeps the total and step limits of a timeout object', () => {
  expect(
    buildTitleCallSettings({ timeout: { totalMs: 60000, stepMs: 20000, chunkMs: 5000 } }).timeout
  ).toEqual({ totalMs: 60000, stepMs: 20000 });
});

test('buildTitleCallSettings passes no timeout when the agent sets only a chunk limit', () => {
  expect(buildTitleCallSettings({ timeout: { chunkMs: 15000 } }).timeout).toBeUndefined();
});
