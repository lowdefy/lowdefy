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

import { convertToModelMessages, validateUIMessages } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { jest } from '@jest/globals';

import createToolLoopAgent from './createToolLoopAgent.js';
import nameAttachedFiles from './nameAttachedFiles.js';

const screenshotUrl = 'https://files.example.com/org_1/nigel/user_1/f1/screenshot.png?sig=x';

// A chat as AgentChat sends it: an uploaded screenshot with its storage key, then a reply.
const uiMessages = [
  {
    id: 'm1',
    role: 'user',
    parts: [
      { type: 'text', text: 'The save button does nothing.' },
      {
        type: 'file',
        url: screenshotUrl,
        mediaType: 'image/png',
        filename: 'screenshot.png',
        providerMetadata: { lowdefy: { key: 'org_1/nigel/user_1/f1/screenshot.png' } },
      },
    ],
  },
  { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'Which page?' }] },
  { id: 'm3', role: 'user', parts: [{ type: 'text', text: 'The ticket page.' }] },
];

test('nameAttachedFiles puts a text part naming each file before it', () => {
  const prompt = [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Look.' },
        { type: 'file', data: new URL(screenshotUrl), mediaType: 'image/png', filename: 'a.png' },
        { type: 'file', data: new URL(screenshotUrl), mediaType: 'image/png', filename: 'b.png' },
      ],
    },
  ];
  expect(nameAttachedFiles(prompt)[0].content).toEqual([
    { type: 'text', text: 'Look.' },
    { type: 'text', text: 'Attached file: a.png' },
    { type: 'file', data: new URL(screenshotUrl), mediaType: 'image/png', filename: 'a.png' },
    { type: 'text', text: 'Attached file: b.png' },
    { type: 'file', data: new URL(screenshotUrl), mediaType: 'image/png', filename: 'b.png' },
  ]);
});

test('nameAttachedFiles drops the lowdefy provider options and keeps other providers options', () => {
  const prompt = [
    {
      role: 'user',
      content: [
        {
          type: 'file',
          data: new URL(screenshotUrl),
          mediaType: 'image/png',
          filename: 'a.png',
          providerOptions: { lowdefy: { key: 'k1' } },
        },
        {
          type: 'file',
          data: new URL(screenshotUrl),
          mediaType: 'image/png',
          filename: 'b.png',
          providerOptions: { lowdefy: { key: 'k2' }, anthropic: { cacheControl: { type: 'x' } } },
        },
      ],
    },
  ];
  const [, first, , second] = nameAttachedFiles(prompt)[0].content;
  expect(first).not.toHaveProperty('providerOptions');
  expect(second.providerOptions).toEqual({ anthropic: { cacheControl: { type: 'x' } } });
});

test('nameAttachedFiles leaves a text prompt, a file without a name and other roles alone', () => {
  expect(nameAttachedFiles('Go.')).toBe('Go.');
  const prompt = [
    { role: 'system', content: 'Be brief.' },
    { role: 'user', content: 'Hello.' },
    { role: 'assistant', content: [{ type: 'text', text: 'Hi.' }] },
    {
      role: 'user',
      content: [{ type: 'file', data: new URL(screenshotUrl), mediaType: 'image/png' }],
    },
  ];
  expect(nameAttachedFiles(prompt)).toEqual(prompt);
});

test('the model gets each chat file named and without its storage key', async () => {
  const model = new MockLanguageModelV4({
    supportedUrls: { 'image/*': [/^https:\/\//] },
    doGenerate: {
      content: [{ type: 'text', text: 'Noted.' }],
      finishReason: { unified: 'stop', raw: 'stop' },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 2, text: 2, reasoning: 0 },
      },
      warnings: [],
    },
  });
  const { agentInstance } = await createToolLoopAgent({
    connection: { provider: () => model },
    agent: { agentId: 'support_agent', properties: { model: 'mock' }, tools: [] },
    context: {
      agentContext: { sharedStateReadOnly: true },
      callEndpoint: jest.fn(),
      logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    },
  });

  const validated = await validateUIMessages({ messages: uiMessages });
  expect(validated[0].parts[1].providerMetadata).toEqual({
    lowdefy: { key: 'org_1/nigel/user_1/f1/screenshot.png' },
  });
  await agentInstance.generate({ prompt: await convertToModelMessages(validated) });

  const sent = model.doGenerateCalls[0].prompt;
  const firstUser = sent.find((message) => message.role === 'user');
  expect(firstUser.content.map((part) => part.type)).toEqual(['text', 'text', 'file']);
  expect(firstUser.content[1]).toEqual({ type: 'text', text: 'Attached file: screenshot.png' });
  expect(JSON.stringify(sent)).not.toContain('org_1/nigel/user_1/f1/screenshot.png"');
  expect(JSON.stringify(sent)).not.toContain('lowdefy');
  expect(uiMessages[0].parts).toHaveLength(2);
});
