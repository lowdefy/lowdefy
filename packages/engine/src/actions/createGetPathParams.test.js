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

import testContext from '../../test/testContext.js';

const lowdefy = {
  _internal: {
    actions: {
      Action: ({ methods: { getPathParams }, params }) => getPathParams(params),
    },
  },
};

console.log = () => {};
console.error = () => {};

const getPageConfig = () => ({
  id: 'ticket',
  type: 'Box',
  blocks: [
    {
      id: 'button',
      type: 'Button',
      events: {
        onClick: [{ id: 'a', type: 'Action', params: 'ticket_id' }],
        onAll: [{ id: 'a', type: 'Action', params: true }],
        onMissing: [{ id: 'a', type: 'Action', params: { key: 'missing', default: 'none' } }],
      },
    },
  ],
});

async function getButton() {
  const context = await testContext({
    lowdefy,
    pageConfig: getPageConfig(),
    path: 'tickets/{space}/{ticket_id}',
    pathParams: { space: 'support', ticket_id: '1234' },
  });
  return context._internal.RootSlots.map['button'];
}

test('getPathParams returns a value of the page instance', async () => {
  const button = await getButton();
  const { responses } = await button.triggerEvent({ name: 'onClick' });
  expect(responses.a.response).toEqual('1234');
});

test('getPathParams returns all values of the page instance', async () => {
  const button = await getButton();
  const { responses } = await button.triggerEvent({ name: 'onAll' });
  expect(responses.a.response).toEqual({ space: 'support', ticket_id: '1234' });
});

test('getPathParams returns the default for a missing key', async () => {
  const button = await getButton();
  const { responses } = await button.triggerEvent({ name: 'onMissing' });
  expect(responses.a.response).toEqual('none');
});
