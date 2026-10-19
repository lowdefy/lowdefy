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

// Well-formed steps, keyed by step and by expect kind. A step error ends with
// the examples for its step, so an agent that wrote a step wrong gets the
// right form back; the journey step schema carries the same examples.
const JOURNEY_STEP_EXAMPLES = {
  click: [{ click: 'save_button' }, { click: { text: 'OK' } }],
  open: [{ open: 'status_selector' }],
  fill: [
    { fill: { blockId: 'name_input', value: 'Ada' } },
    { fill: { blockId: 'code_input', fromEmail: { to: 'ada@example.com', match: '\\d{6}' } } },
  ],
  select: [{ select: { blockId: 'status_selector', value: 'Open' } }],
  press: [{ press: 'Enter' }],
  back: [{ back: true }],
  goto: [
    { goto: 'dashboard' },
    { goto: { pageId: 'ticket', pathParams: { ticket_id: '1234' }, urlQuery: { tab: 'notes' } } },
  ],
  email: [{ email: { to: 'ada@example.com', subject: 'Verify' } }],
  as: [{ as: 'invitee' }],
  wait: [{ wait: { request: 'get_orders' } }, { wait: { state: 'orders' } }, { wait: { ms: 500 } }],
  screenshot: [{ screenshot: 'after_save' }],
  expect: [{ expect: { visible: 'save_button' } }, { expect: { url: { contains: '/orders' } } }],
  'expect.state': [{ expect: { state: { path: 'order.status', equals: 'Open' } } }],
  'expect.visible': [{ expect: { visible: 'save_button' } }],
  'expect.hidden': [{ expect: { hidden: 'error_alert' } }],
  'expect.text': [{ expect: { text: { blockId: 'title', contains: 'Orders' } } }],
  'expect.url': [{ expect: { url: { contains: '/orders' } } }],
  'expect.title': [{ expect: { title: { contains: 'Orders' } } }],
  'expect.calls': [
    { expect: { calls: { request: 'save_order', count: 1 } } },
    { expect: { calls: { endpoint: 'orders-sync', count: 1 } } },
  ],
  'expect.error': [{ expect: { error: 'is required' } }],
  'expect.effect': [{ expect: { effect: true } }],
};

export default JOURNEY_STEP_EXAMPLES;
