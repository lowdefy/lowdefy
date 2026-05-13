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
import { jest } from '@jest/globals';

import testContext from '../../test/testContext.js';

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

console.log = () => {};
console.error = () => {};

beforeEach(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

test('translate method returns the localized message for a key', async () => {
  const lowdefy = {
    i18n: {
      active: 'de-DE',
      defaultLocale: 'en-US',
      messages: {
        'en-US': { greeting: 'Hello' },
        'de-DE': { greeting: 'Hallo' },
      },
    },
    _internal: {
      actions: {
        Action: ({ methods: { translate } }) => translate('greeting'),
      },
    },
  };
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'a', type: 'Action' }],
        },
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const button = context._internal.RootSlots.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res.success).toBe(true);
  expect(res.responses.a.response).toBe('Hallo');
});

test('translate method substitutes ICU values', async () => {
  const lowdefy = {
    i18n: {
      active: 'en-US',
      defaultLocale: 'en-US',
      messages: {
        'en-US': { welcome: 'Welcome, {name}!' },
      },
    },
    _internal: {
      actions: {
        Action: ({ methods: { translate } }) => translate('welcome', { name: 'Ada' }),
      },
    },
  };
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: { onClick: [{ id: 'a', type: 'Action' }] },
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const button = context._internal.RootSlots.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res.responses.a.response).toBe('Welcome, Ada!');
});

test('translate method falls back to the key when no translation exists', async () => {
  const lowdefy = {
    i18n: { active: 'en-US', defaultLocale: 'en-US', messages: {} },
    _internal: {
      actions: {
        Action: ({ methods: { translate } }) => translate('unknown.key'),
      },
    },
  };
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: { onClick: [{ id: 'a', type: 'Action' }] },
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const button = context._internal.RootSlots.map['button'];
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res.responses.a.response).toBe('unknown.key');
});
