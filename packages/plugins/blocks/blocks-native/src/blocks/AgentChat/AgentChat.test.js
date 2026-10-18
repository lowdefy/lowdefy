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

import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { ActionSheetIOS, StyleSheet } from 'react-native';
import { jest } from '@jest/globals';
import { Link } from '@lowdefy/actions-core/actions';

import { page, record, renderPage } from '../../test/renderPage.js';

// The UI message stream the agent route answers with, as server-sent events.
function sse(chunks) {
  const body = [...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`), 'data: [DONE]\n\n'];
  return new Response(body.join(''), {
    headers: { 'content-type': 'text/event-stream' },
    status: 200,
  });
}

function textReply({ id = 'a1', text }) {
  return [
    { type: 'start', messageId: id },
    { type: 'start-step' },
    { type: 'text-start', id: 't1' },
    { type: 'text-delta', id: 't1', delta: text },
    { type: 'text-end', id: 't1' },
    { type: 'finish-step' },
    { type: 'finish' },
  ];
}

function chatPage({ events = {}, properties = {} } = {}) {
  return page([
    {
      id: 'nigel',
      type: 'AgentChat',
      properties: {
        agentId: 'nigel',
        welcome: {
          title: "Hi, I'm Nigel",
          description: 'I can log a task for you.',
          prompts: [{ label: 'What is waiting on me?', description: 'Questions and reviews' }],
        },
        ...properties,
      },
      events,
    },
  ]);
}

async function send(text) {
  const footer = screen.getByTestId('screen-footer');
  await act(async () => {
    fireEvent.changeText(within(footer).getByTestId('nigel_input'), text);
  });
  await act(async () => {
    fireEvent.press(within(footer).getByTestId('nigel_send'));
  });
}

test('an empty AgentChat shows the welcome, and its prompts as chips in the screen footer', async () => {
  await renderPage({ pageConfig: chatPage() });
  expect(screen.getByText("Hi, I'm Nigel")).toBeTruthy();
  expect(screen.getByText('I can log a task for you.')).toBeTruthy();
  const footer = screen.getByTestId('screen-footer');
  expect(within(footer).getByText('What is waiting on me?')).toBeTruthy();
  expect(within(footer).getByTestId('nigel_input')).toBeTruthy();
});

test('a sent message posts to the agent route through the host stream and streams the reply in', async () => {
  const { host } = await renderPage({
    pageConfig: chatPage({ properties: { sharedState: { space: 'PEL' } } }),
  });
  host.streamFetch.mockImplementation(async () =>
    sse(textReply({ text: 'Two **questions** wait on you.' }))
  );
  await send('What is waiting on me?');
  await waitFor(() => expect(screen.getByText('questions')).toBeTruthy());
  expect(screen.getByText('What is waiting on me?')).toBeTruthy();
  expect(host.streamFetch).toHaveBeenCalledTimes(1);
  const [url, init] = host.streamFetch.mock.calls[0];
  expect(url).toMatch(
    /^https:\/\/app\.lowdefy\.test\/api\/agent\/home\/nigel\?conversationId=chat_/
  );
  expect(init.method).toEqual('POST');
  const body = JSON.parse(init.body);
  expect(body.sharedState).toEqual({ space: 'PEL' });
  expect(body.messages).toHaveLength(1);
  expect(body.messages[0].parts).toEqual([{ type: 'text', text: 'What is waiting on me?' }]);
});

test('a reply draws its reasoning collapsed, its tool calls as compact rows and its text', async () => {
  const { host } = await renderPage({ pageConfig: chatPage() });
  host.streamFetch.mockImplementation(async () =>
    sse([
      { type: 'start', messageId: 'a1' },
      { type: 'start-step' },
      { type: 'reasoning-start', id: 'r1' },
      { type: 'reasoning-delta', id: 'r1', delta: 'The person wants their open questions.' },
      { type: 'reasoning-end', id: 'r1' },
      { type: 'tool-input-start', toolCallId: 'c1', toolName: 'search_designs' },
      {
        type: 'tool-input-available',
        toolCallId: 'c1',
        toolName: 'search_designs',
        input: { q: 'payroll' },
      },
      {
        type: 'tool-output-available',
        toolCallId: 'c1',
        output: [{ key: 'PEL-645', title: 'Payroll' }],
      },
      { type: 'finish-step' },
      { type: 'start-step' },
      { type: 'text-start', id: 't1' },
      { type: 'text-delta', id: 't1', delta: 'PEL-645 needs you.' },
      { type: 'text-end', id: 't1' },
      { type: 'finish-step' },
      { type: 'finish' },
    ])
  );
  await send('What is waiting on me?');
  await waitFor(() => expect(screen.getByText('PEL-645 needs you.')).toBeTruthy());
  expect(screen.getByText('Search designs')).toBeTruthy();
  expect(screen.getByText('Returned 1 result')).toBeTruthy();
  // Reasoning is behind its disclosure until pressed.
  expect(screen.queryByText('The person wants their open questions.')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Thought process'));
  });
  expect(screen.getByText('The person wants their open questions.')).toBeTruthy();
  // A finished call opens to its output as readable rows.
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Search designs'));
  });
  expect(screen.getByText('PEL-645')).toBeTruthy();
  expect(screen.getByText('Payroll')).toBeTruthy();
});

test('a tool call waiting for approval is answered with Approve, which continues the reply', async () => {
  const { host } = await renderPage({ pageConfig: chatPage() });
  host.streamFetch
    .mockImplementationOnce(async () =>
      sse([
        { type: 'start', messageId: 'a1' },
        { type: 'start-step' },
        {
          type: 'tool-input-available',
          toolCallId: 'c1',
          toolName: 'write_task',
          input: { title: 'Fix login' },
        },
        { type: 'tool-approval-request', approvalId: 'ap1', toolCallId: 'c1' },
        { type: 'finish-step' },
        { type: 'finish' },
      ])
    )
    .mockImplementationOnce(async () => sse(textReply({ id: 'a1', text: 'Logged PEL-900.' })));
  await send('Log a task to fix login');
  await waitFor(() => expect(screen.getByTestId('nigel_message_a1_approval_c1')).toBeTruthy());
  expect(screen.getByText('Write task')).toBeTruthy();
  expect(screen.getByText('Fix login')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('nigel_message_a1_approval_c1_approve'));
  });
  await waitFor(() => expect(host.streamFetch).toHaveBeenCalledTimes(2));
  const { messages } = JSON.parse(host.streamFetch.mock.calls[1][1].body);
  const toolPart = messages[1].parts.find((part) => part.toolCallId === 'c1');
  expect(toolPart.approval).toEqual({ id: 'ap1', approved: true });
  await waitFor(() => expect(screen.getByText('Logged PEL-900.')).toBeTruthy());
});

test('update-page-state writes the shared keys into the page state and reports back', async () => {
  const { host } = await renderPage({
    pageConfig: page([
      {
        id: 'nigel',
        type: 'AgentChat',
        properties: { agentId: 'nigel', sharedState: { space: { _state: 'space' } } },
      },
      { id: 'shown', type: 'Paragraph', properties: { content: { _state: 'space' } } },
    ]),
  });
  host.streamFetch
    .mockImplementationOnce(async () =>
      sse([
        { type: 'start', messageId: 'a1' },
        { type: 'start-step' },
        {
          type: 'tool-input-available',
          toolCallId: 'c1',
          toolName: 'update-page-state',
          input: { updates: { space: 'OPS', secret: 'x' } },
        },
        { type: 'finish-step' },
        { type: 'finish' },
      ])
    )
    .mockImplementationOnce(async () => sse(textReply({ id: 'a1', text: 'Switched to OPS.' })));
  await send('Show me the OPS space');
  await waitFor(() => expect(screen.getByText('Switched to OPS.')).toBeTruthy());
  expect(screen.getByText('OPS')).toBeTruthy();
  const { messages } = JSON.parse(host.streamFetch.mock.calls[1][1].body);
  const toolPart = messages[1].parts.find((part) => part.toolCallId === 'c1');
  expect(toolPart.output).toEqual({ ok: true, written: ['space'], ignored: ['secret'] });
});

test('a failed reply shows the error with Try again, which asks again', async () => {
  const { host } = await renderPage({
    pageConfig: chatPage({ events: { onError: record('error') } }),
  });
  host.streamFetch
    .mockImplementationOnce(async () => new Response('The agent is unavailable.', { status: 500 }))
    .mockImplementationOnce(async () => sse(textReply({ text: 'Here you go.' })));
  await send('Hello');
  await waitFor(() => expect(screen.getByTestId('nigel_error')).toBeTruthy());
  expect(screen.getByText('Something went wrong')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('nigel_error_retry'));
  });
  await waitFor(() => expect(screen.getByText('Here you go.')).toBeTruthy());
  expect(screen.queryByTestId('nigel_error')).toBeNull();
  const { messages } = JSON.parse(host.streamFetch.mock.calls[1][1].body);
  expect(messages.map((message) => message.role)).toEqual(['user']);
});

test('the send button is a stop button while a reply streams', async () => {
  const { calls, host } = await renderPage({
    pageConfig: chatPage({ events: { onStop: record('stop') } }),
  });
  let abortSignal;
  host.streamFetch.mockImplementation(
    (url, init) =>
      new Promise((resolve, reject) => {
        abortSignal = init.signal;
        init.signal.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError'))
        );
      })
  );
  await send('Write me a long answer');
  const footer = screen.getByTestId('screen-footer');
  await waitFor(() => expect(within(footer).getByTestId('nigel_stop')).toBeTruthy());
  await act(async () => {
    fireEvent.press(within(footer).getByTestId('nigel_stop'));
  });
  expect(abortSignal.aborted).toBe(true);
  await waitFor(() => expect(within(footer).getByTestId('nigel_send')).toBeTruthy());
  expect(calls.map((call) => call.name)).toContain('stop');
});

test('a link in a reply opens an app path as a page through the Link action', async () => {
  const { host } = await renderPage({ actions: { Link }, pageConfig: chatPage() });
  host.streamFetch.mockImplementation(async () =>
    sse(textReply({ text: 'See [PEL-645](/PEL/designs/PEL-645).' }))
  );
  await send('Where is payroll?');
  await waitFor(() => expect(screen.getByText('PEL-645')).toBeTruthy());
  await act(async () => {
    fireEvent.press(screen.getByText('PEL-645'));
  });
  expect(host.router.push).toHaveBeenCalledWith(
    expect.objectContaining({ pathname: '/PEL/designs/PEL-645' })
  );
});

// The ai-assistant module's thread endpoints, held in memory, behind a stand-in CallAPI action.
function createThreadEndpoints({ active = null, stored = {} } = {}) {
  const threads = { ...stored };
  const calls = [];
  const endpoints = {
    'ai-assistant/get-active-thread': () => active ?? { conversationId: null, messages: [] },
    'ai-assistant/list-threads': () =>
      Object.entries(threads).map(([key, thread]) => ({ key, label: thread.title, tags: [] })),
    'ai-assistant/get-thread': ({ conversationId }) => ({
      messages: threads[conversationId]?.messages ?? [],
    }),
    'ai-assistant/save-thread': ({ conversationId, messages, title }) => {
      threads[conversationId] = { messages, title: threads[conversationId]?.title ?? title };
      return { saved: true };
    },
    'ai-assistant/delete-thread': ({ conversationId }) => {
      delete threads[conversationId];
      return { deleted: true };
    },
    'ai-assistant/title-thread': () => ({ title: 'Login bug task' }),
  };
  const CallAPI = ({ params }) => {
    calls.push({ endpointId: params.endpointId, payload: params.payload });
    return { response: endpoints[params.endpointId](params.payload) };
  };
  return { CallAPI, calls, threads };
}

function threadsPage({ events = {} } = {}) {
  return page([
    {
      id: 'open_threads',
      type: 'Button',
      properties: { title: 'Chats' },
      events: {
        onClick: [
          { id: 'open', type: 'CallMethod', params: { blockId: 'nigel', method: 'openThreads' } },
        ],
      },
    },
    {
      id: 'nigel',
      type: 'AgentChat',
      properties: { agentId: 'nigel', threads: { module: 'ai-assistant', scope: 'pelican' } },
      events,
    },
  ]);
}

const storedThread = {
  title: 'Payroll questions',
  messages: [
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'What about payroll?' }] },
    { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'PEL-645 holds it.' }] },
  ],
};

test('with threads, the chat resumes the thread last opened and replies in it', async () => {
  const endpoints = createThreadEndpoints({
    active: {
      conversationId: 'pelican_1',
      title: 'Payroll questions',
      messages: storedThread.messages,
    },
    stored: { pelican_1: storedThread },
  });
  const { host } = await renderPage({
    actions: { CallAPI: endpoints.CallAPI },
    pageConfig: threadsPage(),
  });
  await waitFor(() => expect(screen.getByText('PEL-645 holds it.')).toBeTruthy());
  expect(endpoints.calls[0]).toEqual({
    endpointId: 'ai-assistant/get-active-thread',
    payload: { scope: 'pelican' },
  });
  host.streamFetch.mockImplementation(async () =>
    sse(textReply({ id: 'a2', text: 'It is settled.' }))
  );
  await send('Is it settled?');
  await waitFor(() => expect(screen.getByText('It is settled.')).toBeTruthy());
  expect(host.streamFetch.mock.calls[0][0]).toMatch(/conversationId=pelican_1$/);
  await waitFor(() => expect(endpoints.threads.pelican_1.messages).toHaveLength(4));
  // A resumed thread keeps its name: there is no first exchange to title.
  expect(endpoints.calls.some((call) => call.endpointId === 'ai-assistant/title-thread')).toBe(
    false
  );
});

test('with threads, a new chat is saved on its first message and titled from its first exchange', async () => {
  const endpoints = createThreadEndpoints();
  const { host } = await renderPage({
    actions: { CallAPI: endpoints.CallAPI },
    pageConfig: threadsPage(),
  });
  await waitFor(() => expect(screen.getByTestId('screen-footer')).toBeTruthy());
  host.streamFetch.mockImplementation(async () => sse(textReply({ text: 'Logged PEL-900.' })));
  await send('Log a task to fix the login bug');
  await waitFor(() => expect(screen.getByText('Logged PEL-900.')).toBeTruthy());
  const saves = endpoints.calls.filter((call) => call.endpointId === 'ai-assistant/save-thread');
  await waitFor(() => expect(saves.length).toBeGreaterThan(0));
  const [firstSave] = saves;
  expect(firstSave.payload).toMatchObject({
    scope: 'pelican',
    tag: null,
    title: 'Log a task to fix the login bug',
  });
  expect(firstSave.payload.conversationId).toMatch(/^pelican_/);
  await waitFor(() =>
    expect(
      endpoints.calls.find((call) => call.endpointId === 'ai-assistant/title-thread')
    ).toBeTruthy()
  );
  const title = endpoints.calls.find((call) => call.endpointId === 'ai-assistant/title-thread');
  expect(title.payload).toEqual({
    conversationId: firstSave.payload.conversationId,
    prompt: 'Log a task to fix the login bug',
    reply: 'Logged PEL-900.',
    replaces: 'Log a task to fix the login bug',
    context: null,
  });
});

test('the threads sheet lists recent chats, opens one with its messages and deletes one by swipe', async () => {
  const endpoints = createThreadEndpoints({
    stored: {
      pelican_1: storedThread,
      pelican_2: { title: 'Release notes', messages: [] },
    },
  });
  const { calls } = await renderPage({
    actions: { CallAPI: endpoints.CallAPI },
    pageConfig: threadsPage({ events: { onThreadChange: record('thread') } }),
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Chats'));
  });
  const sheet = await screen.findByTestId('nigel_threads');
  await waitFor(() => expect(within(sheet).getByText('Payroll questions')).toBeTruthy());
  expect(within(sheet).getByText('Release notes')).toBeTruthy();
  await act(async () => {
    fireEvent.press(within(sheet).getByText('Payroll questions'));
  });
  await waitFor(() => expect(screen.getByText('PEL-645 holds it.')).toBeTruthy());
  expect(calls.find((call) => call.name === 'thread').event).toEqual({
    conversationId: 'pelican_1',
    title: 'Payroll questions',
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Chats'));
  });
  // The row's swipe actions are its accessibility actions too.
  await waitFor(() => expect(screen.getByTestId('nigel_thread_1_row')).toBeTruthy());
  await act(async () => {
    fireEvent(screen.getByTestId('nigel_thread_1_row'), 'accessibilityAction', {
      nativeEvent: { actionName: 'delete' },
    });
  });
  await waitFor(() => expect(screen.queryByText('Release notes')).toBeNull());
  expect(endpoints.threads.pelican_2).toBeUndefined();
});

test('a long press on a reply copies its text or regenerates it', async () => {
  const copied = [];
  const { host } = await renderPage({
    actions: { CopyToClipboard: ({ params }) => copied.push(params.copy) },
    pageConfig: chatPage(),
  });
  host.streamFetch
    .mockImplementationOnce(async () => sse(textReply({ id: 'a1', text: 'First answer.' })))
    .mockImplementationOnce(async () => sse(textReply({ id: 'a2', text: 'Second answer.' })));
  await send('Hello');
  await waitFor(() => expect(screen.getByText('First answer.')).toBeTruthy());
  const sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');
  sheet.mockImplementationOnce((options, pick) => pick(options.options.indexOf('Copy')));
  await act(async () => {
    fireEvent(screen.getByTestId('nigel_message_a1'), 'longPress');
  });
  expect(copied).toEqual(['First answer.']);
  sheet.mockImplementationOnce((options, pick) => pick(options.options.indexOf('Regenerate')));
  await act(async () => {
    fireEvent(screen.getByTestId('nigel_message_a1'), 'longPress');
  });
  await waitFor(() => expect(screen.getByText('Second answer.')).toBeTruthy());
  expect(screen.queryByText('First answer.')).toBeNull();
  sheet.mockRestore();
});

test('setInput fills the composer and newChat starts an empty conversation', async () => {
  const { host } = await renderPage({
    pageConfig: page([
      {
        id: 'fill',
        type: 'Button',
        properties: { title: 'Fill' },
        events: {
          onClick: [
            {
              id: 'fill',
              type: 'CallMethod',
              params: { blockId: 'nigel', method: 'setInput', args: [{ text: 'Log a ticket' }] },
            },
          ],
        },
      },
      {
        id: 'new',
        type: 'Button',
        properties: { title: 'New' },
        events: {
          onClick: [
            { id: 'new', type: 'CallMethod', params: { blockId: 'nigel', method: 'newChat' } },
          ],
        },
      },
      {
        id: 'nigel',
        type: 'AgentChat',
        properties: { agentId: 'nigel', welcome: { title: 'Hi' } },
      },
    ]),
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Fill'));
  });
  const footer = screen.getByTestId('screen-footer');
  expect(within(footer).getByTestId('nigel_input').props.value).toEqual('Log a ticket');
  host.streamFetch.mockImplementation(async () => sse(textReply({ text: 'Who is it for?' })));
  await act(async () => {
    fireEvent.press(within(footer).getByTestId('nigel_send'));
  });
  await waitFor(() => expect(screen.getByText('Who is it for?')).toBeTruthy());
  const firstConversation = host.streamFetch.mock.calls[0][0];
  await act(async () => {
    fireEvent.press(screen.getByText('New'));
  });
  expect(screen.queryByText('Who is it for?')).toBeNull();
  expect(screen.getByText('Hi')).toBeTruthy();
  await send('Another question');
  await waitFor(() => expect(host.streamFetch).toHaveBeenCalledTimes(2));
  expect(host.streamFetch.mock.calls[1][0]).not.toEqual(firstConversation);
});

test('the thinking dots show until the reply has something to show, then the thinking message', async () => {
  const { host } = await renderPage({
    pageConfig: chatPage({
      properties: {
        messageDisplay: { thinkingMessages: ['Reading the space'], thinkingMessageDelay: 500 },
      },
    }),
  });
  host.streamFetch.mockImplementation(() => new Promise(() => undefined));
  await send('What moved?');
  expect(screen.getByTestId('nigel_thinking')).toBeTruthy();
  await waitFor(() => expect(screen.getByText('Reading the space')).toBeTruthy(), {
    timeout: 1500,
  });
});

test('the user bubble takes the tint fill of the mode showing', async () => {
  const { host } = await renderPage({ darkMode: 'dark', pageConfig: chatPage() });
  host.streamFetch.mockImplementation(async () => sse(textReply({ text: 'Hi.' })));
  await send('Hello');
  await waitFor(() => expect(screen.getByText('Hi.')).toBeTruthy());
  const bubble = screen.getByTestId(/^nigel_message_(?!a1)/);
  const fill = StyleSheet.flatten(bubble.props.style).backgroundColor;
  expect(fill).toMatch(/^rgba\(/);
  expect(fill.endsWith('0.24)')).toBe(true);
});

test('with sender.sticky false the composer sits under the conversation, not in the footer', async () => {
  await renderPage({ pageConfig: chatPage({ properties: { sender: { sticky: false } } }) });
  expect(screen.queryByTestId('screen-footer')).toBeNull();
  expect(screen.getByTestId('nigel_input')).toBeTruthy();
});

test('a reply draws linkChips links as chips, as the Markdown block does, and a press reports it', async () => {
  const { calls, host } = await renderPage({
    pageConfig: chatPage({
      events: { onLinkClick: record('link') },
      properties: { linkChips: [{ scheme: 'pelican', icon: 'House', tone: 'primary' }] },
    }),
  });
  host.streamFetch.mockImplementation(async () =>
    sse(textReply({ text: 'Blocked on [PEL-12 Sign in with a passkey](pelican:PEL-12).' }))
  );
  await send('What is blocked?');
  const chip = await screen.findByLabelText('PEL-12 Sign in with a passkey');
  expect(screen.getByTestId('markdown-chip-icon-PEL-12')).toBeTruthy();
  await act(async () => {
    fireEvent.press(chip);
  });
  expect(calls.find((call) => call.name === 'link').event).toEqual({
    href: 'pelican:PEL-12',
    text: '',
  });
});

test('a reply draws an app path link as a chip by pattern, and a press opens it through the Link action', async () => {
  const { host } = await renderPage({
    actions: { Link },
    pageConfig: chatPage({
      properties: {
        linkChips: [{ pattern: '^/ACME/tasks/(?<key>ACME-\\d+)$', icon: 'House', tone: 'primary' }],
      },
    }),
  });
  host.streamFetch.mockImplementation(async () =>
    sse(textReply({ text: 'Logged [ACME-647 (Fix broken menu URL)](/ACME/tasks/ACME-647).' }))
  );
  await send('Log the menu bug');
  const chip = await screen.findByLabelText('ACME-647 Fix broken menu URL');
  expect(screen.getByTestId('markdown-chip-icon-ACME-647')).toBeTruthy();
  await act(async () => {
    fireEvent.press(chip);
  });
  expect(host.router.push).toHaveBeenCalledWith(
    expect.objectContaining({ pathname: '/ACME/tasks/ACME-647' })
  );
});

const recordSeed = {
  sharedState: { task: { key: 'ACME-12', title: 'Fix the menu' } },
  welcome: { title: 'About ACME-12', description: 'Ask about Fix the menu.' },
  input: 'What is left on ACME-12?',
  tag: 'ACME-12',
  title: 'ACME-12 questions',
};

test('newChat with a seed starts a chat about a record: its welcome, its input and its shared state', async () => {
  const { calls, host } = await renderPage({
    pageConfig: page([
      {
        id: 'ask',
        type: 'Button',
        properties: { title: 'Ask about it' },
        events: {
          onClick: [
            {
              id: 'new',
              type: 'CallMethod',
              params: { blockId: 'nigel', method: 'newChat', args: [recordSeed] },
            },
          ],
        },
      },
      {
        id: 'nigel',
        type: 'AgentChat',
        properties: {
          agentId: 'nigel',
          sharedState: { space: 'ACME' },
          welcome: { title: 'Hi', prompts: [{ label: 'What is waiting on me?' }] },
        },
        events: { onThreadChange: record('thread') },
      },
    ]),
  });
  expect(screen.getByText('Hi')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByText('Ask about it'));
  });
  expect(screen.getByText('About ACME-12')).toBeTruthy();
  expect(screen.getByText('Ask about Fix the menu.')).toBeTruthy();
  const footer = screen.getByTestId('screen-footer');
  // The seed's welcome is laid over the property's, so its prompts stay.
  expect(within(footer).getByText('What is waiting on me?')).toBeTruthy();
  expect(within(footer).getByTestId('nigel_input').props.value).toEqual('What is left on ACME-12?');
  expect(calls.find((call) => call.name === 'thread').event.title).toEqual('ACME-12 questions');
  host.streamFetch.mockImplementation(async () => sse(textReply({ text: 'Only the review.' })));
  await act(async () => {
    fireEvent.press(within(footer).getByTestId('nigel_send'));
  });
  await waitFor(() => expect(screen.getByText('Only the review.')).toBeTruthy());
  const body = JSON.parse(host.streamFetch.mock.calls[0][1].body);
  expect(body.sharedState).toEqual({
    task: { key: 'ACME-12', title: 'Fix the menu' },
    space: 'ACME',
  });
  expect(body.messages[0].parts).toEqual([{ type: 'text', text: 'What is left on ACME-12?' }]);
});

test('with threads, the seed property starts the chat when there is no thread to resume, saved with its tag and title', async () => {
  const endpoints = createThreadEndpoints();
  const { host } = await renderPage({
    actions: { CallAPI: endpoints.CallAPI },
    pageConfig: page([
      {
        id: 'nigel',
        type: 'AgentChat',
        properties: {
          agentId: 'nigel',
          seed: recordSeed,
          threads: { module: 'ai-assistant', scope: 'acme', tag: 'tasks' },
        },
      },
    ]),
  });
  await waitFor(() => expect(screen.getByText('About ACME-12')).toBeTruthy());
  const footer = screen.getByTestId('screen-footer');
  await waitFor(() =>
    expect(within(footer).getByTestId('nigel_input').props.value).toEqual(
      'What is left on ACME-12?'
    )
  );
  host.streamFetch.mockImplementation(async () => sse(textReply({ text: 'Only the review.' })));
  await act(async () => {
    fireEvent.press(within(footer).getByTestId('nigel_send'));
  });
  await waitFor(() => expect(screen.getByText('Only the review.')).toBeTruthy());
  const saves = endpoints.calls.filter((call) => call.endpointId === 'ai-assistant/save-thread');
  await waitFor(() => expect(saves.length).toBeGreaterThan(1));
  saves.forEach((save) =>
    expect(save.payload).toMatchObject({
      scope: 'acme',
      tag: 'ACME-12',
      title: 'ACME-12 questions',
    })
  );
  // The seed's title is the thread's name, so it is not named from the first exchange.
  expect(endpoints.calls.some((call) => call.endpointId === 'ai-assistant/title-thread')).toBe(
    false
  );
});

test('with threads, a resumed thread opens in place of the seed property', async () => {
  const endpoints = createThreadEndpoints({
    active: {
      conversationId: 'acme_1',
      title: 'Payroll questions',
      messages: storedThread.messages,
    },
    stored: { acme_1: storedThread },
  });
  await renderPage({
    actions: { CallAPI: endpoints.CallAPI },
    pageConfig: page([
      {
        id: 'nigel',
        type: 'AgentChat',
        properties: {
          agentId: 'nigel',
          seed: recordSeed,
          threads: { module: 'ai-assistant', scope: 'acme' },
        },
      },
    ]),
  });
  await waitFor(() => expect(screen.getByText('PEL-645 holds it.')).toBeTruthy());
  expect(screen.queryByText('About ACME-12')).toBeNull();
  expect(
    within(screen.getByTestId('screen-footer')).getByTestId('nigel_input').props.value
  ).toEqual('');
});

// Thread endpoints whose get-active-thread answers only when the test resolves it.
function createSlowResumeEndpoints() {
  const endpoints = createThreadEndpoints({ stored: { acme_1: storedThread } });
  let resolveActive;
  const active = new Promise((resolve) => {
    resolveActive = () =>
      resolve({
        conversationId: 'acme_1',
        title: 'Payroll questions',
        messages: storedThread.messages,
      });
  });
  const CallAPI = (options) => {
    if (options.params.endpointId === 'ai-assistant/get-active-thread') {
      endpoints.calls.push({
        endpointId: options.params.endpointId,
        payload: options.params.payload,
      });
      return active.then((response) => ({ response }));
    }
    return endpoints.CallAPI(options);
  };
  return { ...endpoints, CallAPI, resolveActive };
}

function slowResumePage({ args } = {}) {
  return page([
    {
      id: 'new',
      type: 'Button',
      properties: { title: 'New' },
      events: {
        onClick: [
          {
            id: 'new',
            type: 'CallMethod',
            params: { blockId: 'nigel', method: 'newChat', ...(args ? { args } : {}) },
          },
        ],
      },
    },
    {
      id: 'nigel',
      type: 'AgentChat',
      properties: {
        agentId: 'nigel',
        welcome: { title: 'Hi' },
        threads: { module: 'ai-assistant', scope: 'acme' },
      },
    },
  ]);
}

test('newChat while the last thread is still resuming cancels the resume, so the new chat stays', async () => {
  const endpoints = createSlowResumeEndpoints();
  const { host } = await renderPage({
    actions: { CallAPI: endpoints.CallAPI },
    pageConfig: slowResumePage({ args: [recordSeed] }),
  });
  expect(screen.getByTestId('nigel_loading')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByText('New'));
  });
  expect(screen.queryByTestId('nigel_loading')).toBeNull();
  expect(screen.getByText('About ACME-12')).toBeTruthy();
  await act(async () => {
    endpoints.resolveActive();
  });
  expect(screen.getByText('About ACME-12')).toBeTruthy();
  expect(screen.queryByText('PEL-645 holds it.')).toBeNull();
  host.streamFetch.mockImplementation(async () => sse(textReply({ text: 'Only the review.' })));
  const footer = screen.getByTestId('screen-footer');
  await act(async () => {
    fireEvent.press(within(footer).getByTestId('nigel_send'));
  });
  await waitFor(() => expect(screen.getByText('Only the review.')).toBeTruthy());
  expect(host.streamFetch.mock.calls[0][0]).not.toMatch(/conversationId=acme_1$/);
});

test('an unseeded newChat while the last thread is still resuming keeps the empty chat', async () => {
  const endpoints = createSlowResumeEndpoints();
  await renderPage({
    actions: { CallAPI: endpoints.CallAPI },
    pageConfig: slowResumePage(),
  });
  expect(screen.getByTestId('nigel_loading')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByText('New'));
  });
  expect(screen.getByText('Hi')).toBeTruthy();
  await act(async () => {
    endpoints.resolveActive();
  });
  expect(screen.getByText('Hi')).toBeTruthy();
  expect(screen.queryByText('PEL-645 holds it.')).toBeNull();
});
