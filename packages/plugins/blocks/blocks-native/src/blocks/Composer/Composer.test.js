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
import { Linking } from 'react-native';
import { act, fireEvent, screen, within } from '@testing-library/react-native';

import {
  emitSpeechEvent,
  ExpoSpeechRecognitionModule as speech,
  setSpeechRecognition,
} from '../../test/expoSpeechRecognition.js';
import formPage from '../../test/formPage.js';
import { renderPage } from '../../test/renderPage.js';

const mentions = [
  { value: 'u1', label: 'Sam Tolmay', sees: true },
  { value: 'u2', label: 'Samantha Hidden', sees: false },
];

async function type(input, text, cursor = text.length) {
  await act(async () => {
    fireEvent(input, 'selectionChange', {
      nativeEvent: { selection: { start: cursor - 1, end: cursor - 1 } },
    });
    fireEvent.changeText(input, text);
    fireEvent(input, 'selectionChange', {
      nativeEvent: { selection: { start: cursor, end: cursor } },
    });
  });
}

test('a Composer offers people who see the record for an @ and stores the picked mention token', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [{ id: 'comment', type: 'Composer', properties: { mentions } }],
      mirrorKey: 'comment',
    }),
  });
  const input = await screen.findByTestId('comment_input');
  await type(input, 'Thanks @sa');
  expect(screen.getByLabelText('Mention Sam Tolmay')).toBeTruthy();
  expect(screen.queryByLabelText('Mention Samantha Hidden')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Mention Sam Tolmay'));
  });
  expect(screen.getByText('Thanks [[user:u1]]')).toBeTruthy();
  expect(screen.getByText('@Sam Tolmay')).toBeTruthy();
  expect(screen.queryByTestId('composer_suggestions')).toBeNull();
});

test('a Composer shows the picture of a person in the mention picker', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [
        {
          id: 'comment',
          type: 'Composer',
          properties: {
            mentions: [
              {
                value: 'u1',
                label: 'Sam Tolmay',
                sees: true,
                picture: 'https://img.example/sam.png',
              },
            ],
          },
        },
      ],
      mirrorKey: 'comment',
    }),
  });
  await type(await screen.findByTestId('comment_input'), '@sa');
  expect(screen.getByTestId('expo-image').props.source).toEqual({
    uri: 'https://img.example/sam.png',
  });
});

test('a Composer sends the body and reply_to with onSubmit and clears when the actions succeed', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [
        {
          id: 'comment',
          type: 'Composer',
          properties: { replyTo: { id: 'c1', name: 'Ada' } },
          events: {
            onSubmit: [
              {
                id: 'sent',
                type: 'SetState',
                params: { sent: { _event: 'body' }, to: { _event: 'reply_to' } },
              },
            ],
          },
        },
        { id: 'sent_text', type: 'Paragraph', properties: { content: { _state: 'sent' } } },
        { id: 'to_text', type: 'Paragraph', properties: { content: { _state: 'to' } } },
      ],
      mirrorKey: 'comment',
    }),
  });
  expect(screen.getByText('Ada')).toBeTruthy();
  const send = screen.getByTestId('composer_send');
  expect(send.props.accessibilityState.disabled).toBe(true);
  await type(await screen.findByTestId('comment_input'), 'Looks good');
  expect(screen.getByTestId('composer_send').props.accessibilityState.disabled).toBe(false);
  await act(async () => {
    fireEvent.press(screen.getByTestId('composer_send'));
  });
  expect(screen.getByText('Looks good')).toBeTruthy();
  expect(screen.getByText('c1')).toBeTruthy();
  expect(screen.getByTestId('composer_send').props.accessibilityState.disabled).toBe(true);
});

test('a Composer keeps its text when the onSubmit actions fail', async () => {
  await renderPage({
    actions: {
      Fail: () => {
        throw new Error('Offline');
      },
    },
    pageConfig: formPage({
      blocks: [
        {
          id: 'comment',
          type: 'Composer',
          events: { onSubmit: [{ id: 'fail', type: 'Fail' }] },
        },
      ],
      mirrorKey: 'comment',
    }),
  });
  await type(await screen.findByTestId('comment_input'), 'Draft');
  await act(async () => {
    fireEvent.press(screen.getByTestId('composer_send'));
  });
  // The input and the mirror of the value both still hold it.
  expect(screen.getAllByText('Draft')).toHaveLength(2);
  expect(screen.getByTestId('composer_send').props.accessibilityState.disabled).toBe(false);
});

test('a Composer asks for record links after [[ and writes the picked key', async () => {
  await renderPage({
    pageConfig: formPage({
      blocks: [
        {
          id: 'comment',
          type: 'Composer',
          properties: { links: [{ key: 'PEL-12', kind: 'task', title: 'Fix the rail' }] },
          events: {
            onLinkSearch: [{ id: 'q', type: 'SetState', params: { q: { _event: 'query' } } }],
          },
        },
        { id: 'q_text', type: 'Paragraph', properties: { content: { _state: 'q' } } },
      ],
      mirrorKey: 'comment',
    }),
  });
  jest.useFakeTimers();
  await type(await screen.findByTestId('comment_input'), 'See [[pel');
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
  jest.useRealTimers();
  expect(screen.getByText('pel')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Link PEL-12 Fix the rail'));
  });
  expect(screen.getByText('See [[PEL-12]]')).toBeTruthy();
});

describe('spoken mentions', () => {
  const people = [
    { value: 'u1', label: 'Sam Tolmay', sees: true },
    { value: 'u2', label: 'Puffin Agent', sees: true },
  ];

  function composerPage(properties = {}) {
    return formPage({
      blocks: [
        {
          id: 'comment',
          type: 'Composer',
          properties: { mentions: people, ...properties },
          events: {
            onSubmit: [{ id: 'sent', type: 'SetState', params: { sent: { _event: 'body' } } }],
          },
        },
        { id: 'sent_text', type: 'Paragraph', properties: { content: { _state: 'sent' } } },
      ],
      mirrorKey: 'comment',
    });
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  test('dictated addressing becomes a mention once the text is still', async () => {
    await renderPage({ pageConfig: composerPage() });
    const input = await screen.findByTestId('comment_input');
    jest.useFakeTimers();
    await type(input, 'For Puffin, please check the build');
    expect(screen.getAllByText('For Puffin, please check the build')).toHaveLength(2);
    await act(async () => {
      jest.advanceTimersByTime(900);
    });
    expect(screen.getByText('[[user:u2]] please check the build')).toBeTruthy();
    expect(screen.getByText('@Puffin Agent')).toBeTruthy();
  });

  test('more dictated text holds the conversion back until it stops', async () => {
    await renderPage({ pageConfig: composerPage() });
    const input = await screen.findByTestId('comment_input');
    jest.useFakeTimers();
    await type(input, 'for Sam ');
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await type(input, 'for Sam can you look');
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.getAllByText('for Sam can you look')).toHaveLength(2);
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(screen.getByText('[[user:u1]] can you look')).toBeTruthy();
  });

  test('sending converts what is left, a name at the end included', async () => {
    await renderPage({ pageConfig: composerPage() });
    await type(await screen.findByTestId('comment_input'), 'Merged. For Sam');
    await act(async () => {
      fireEvent.press(screen.getByTestId('composer_send'));
    });
    expect(screen.getByText('Merged. [[user:u1]]')).toBeTruthy();
  });

  test('the trigger words are configurable', async () => {
    await renderPage({ pageConfig: composerPage({ spokenMentions: { words: ['hey'] } }) });
    await type(await screen.findByTestId('comment_input'), 'Hey Sam, can you look');
    await act(async () => {
      fireEvent.press(screen.getByTestId('composer_send'));
    });
    expect(screen.getByText('[[user:u1]] can you look')).toBeTruthy();
  });

  test('spokenMentions false leaves the text as it is', async () => {
    await renderPage({ pageConfig: composerPage({ spokenMentions: false }) });
    await type(await screen.findByTestId('comment_input'), 'for Sam, can you look');
    await act(async () => {
      fireEvent.press(screen.getByTestId('composer_send'));
    });
    expect(screen.getAllByText('for Sam, can you look').length).toBeGreaterThan(0);
    expect(screen.queryByText('[[user:u1]] can you look')).toBeNull();
  });
});

describe('dictation', () => {
  const people = [
    { value: 'u1', label: 'Sam Tolmay', sees: true },
    { value: 'u2', label: 'Puffin Agent', sees: true },
  ];

  function composerPage(properties = {}) {
    return formPage({
      blocks: [
        {
          id: 'comment',
          type: 'Composer',
          properties: { mentions: people, ...properties },
          events: {
            onSubmit: [{ id: 'sent', type: 'SetState', params: { sent: { _event: 'body' } } }],
          },
        },
        { id: 'sent_text', type: 'Paragraph', properties: { content: { _state: 'sent' } } },
      ],
      mirrorKey: 'comment',
    });
  }

  async function renderComposer(properties) {
    await renderPage({ pageConfig: composerPage(properties) });
    const input = await screen.findByTestId('comment_input');
    // Let the availability check settle.
    await act(async () => {});
    return input;
  }

  async function pressMic() {
    await act(async () => {
      fireEvent.press(screen.getByTestId('comment_dictation'));
    });
  }

  async function emit(name, event) {
    await act(async () => {
      emitSpeechEvent(name, event);
    });
  }

  function partial(transcript) {
    return { isFinal: false, results: [{ transcript, confidence: 0, segments: [] }] };
  }

  function final(transcript) {
    return { isFinal: true, results: [{ transcript, confidence: 0.9, segments: [] }] };
  }

  // iOS: the one final result after stop, then the end.
  async function dictate(words) {
    await pressMic();
    await emit('result', final(words));
    await emit('end');
  }

  beforeEach(() => {
    setSpeechRecognition();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('the mic sits in the field and starts with the mention labels as hints', async () => {
    await renderComposer();
    expect(screen.getByLabelText('Dictate')).toBeTruthy();
    await pressMic();
    expect(speech.start).toHaveBeenCalledTimes(1);
    expect(speech.start.mock.calls[0][0].contextualStrings).toEqual(['Sam Tolmay', 'Puffin Agent']);
    expect(screen.getByTestId('comment_listening')).toBeTruthy();
    expect(screen.getByLabelText('Stop dictation')).toBeTruthy();
    await pressMic();
    expect(speech.stop).toHaveBeenCalledTimes(1);
  });

  test('the mic sits at the field’s trailing edge and the listening row above the field', async () => {
    const flat = (style) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
    const input = await renderComposer();
    // The field holds the input, then the mic, centred on the first line; send stays outside it.
    const field = input.parent;
    expect(flat(field.props.style)).toMatchObject({ flexDirection: 'row', paddingRight: 6 });
    expect(field.children.at(-1).props.style).toEqual({ paddingBottom: 5 });
    expect(flat(screen.getByTestId('comment_dictation').props.style)).toMatchObject({
      height: 28,
      width: 28,
    });
    expect(within(field).queryByTestId('composer_send')).toBeNull();
    await pressMic();
    const ids = [];
    const walk = (node) => {
      if (typeof node === 'string') return;
      if (node.props.testID) ids.push(node.props.testID);
      node.children.forEach(walk);
    };
    walk(screen.getAllByTestId('comment').at(-1));
    expect(ids.indexOf('comment_listening')).toBeLessThan(ids.indexOf('comment_input'));
    // The red stop replaces the plain mic.
    expect(flat(screen.getByTestId('comment_dictation').props.style).backgroundColor).toEqual(
      expect.any(String)
    );
  });

  test('the mic is hidden where the phone cannot recognise speech on the device', async () => {
    setSpeechRecognition({ onDevice: false });
    await renderComposer();
    expect(screen.queryByTestId('comment_dictation')).toBeNull();
  });

  test('the mic is hidden with dictation false', async () => {
    await renderComposer({ dictation: false });
    expect(screen.queryByTestId('comment_dictation')).toBeNull();
  });

  test('words still being heard show grey at the cursor and are not in the value', async () => {
    const input = await renderComposer();
    await type(input, 'Looks good.');
    await pressMic();
    await emit('result', partial('for Sam can you check'));
    const shown = screen.getByTestId('composer_partial');
    expect(shown.props.children).toBe(' for Sam can you check');
    expect(shown.props.style.color).not.toBe(input.props.style[0].color);
    // The input and the mirror of the value both hold the typed text, and only that.
    expect(screen.getAllByText('Looks good.')).toHaveLength(2);
    expect(screen.queryByText('Looks good. for Sam can you check')).toBeNull();
    expect(screen.getByTestId('composer_send').props.accessibilityState.disabled).toBe(false);
  });

  test('a final "for <first name>, …" becomes one mention, and send leaves it alone', async () => {
    await renderComposer();
    await dictate('for Sam, can you look');
    expect(screen.getByText('[[user:u1]] can you look')).toBeTruthy();
    expect(screen.getByText('@Sam Tolmay')).toBeTruthy();
    expect(screen.queryByTestId('comment_listening')).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId('composer_send'));
    });
    expect(screen.getByText('[[user:u1]] can you look')).toBeTruthy();
  });

  test('a mention converts as the final words commit, without waiting for the still-timer', async () => {
    await renderComposer();
    jest.useFakeTimers();
    await dictate('Merged. For Puffin, please check the build');
    expect(screen.getByText('Merged. [[user:u2]] please check the build')).toBeTruthy();
  });

  test('words dictated mid-sentence after "Please ask" stay text', async () => {
    const input = await renderComposer();
    await type(input, 'Please ask to look', 10);
    await dictate('for Sam');
    expect(screen.getAllByText('Please ask for Sam to look')).toHaveLength(2);
  });

  test('a name split across two final segments converts', async () => {
    await renderComposer();
    await pressMic();
    await emit('result', final('for'));
    await emit('result', final('Sam, can you look'));
    await emit('end');
    expect(screen.getByText('[[user:u1]] can you look')).toBeTruthy();
  });

  test('final segments go in one after another at the cursor', async () => {
    const input = await renderComposer();
    await type(input, 'Start end', 5);
    await pressMic();
    await emit('result', final('one'));
    await emit('result', final('two'));
    await emit('end');
    expect(screen.getAllByText('Start one two end')).toHaveLength(2);
  });

  test('spokenMentions false keeps the dictated words as said', async () => {
    await renderComposer({ spokenMentions: false });
    await dictate('for Sam, can you look');
    expect(screen.getAllByText('for Sam, can you look')).toHaveLength(2);
  });

  test('cancel restores the text and cursor the session started with', async () => {
    const input = await renderComposer();
    await type(input, 'Draft');
    await pressMic();
    await emit('result', final('more words'));
    expect(screen.getAllByText('Draft more words')).toHaveLength(2);
    await act(async () => {
      fireEvent.press(screen.getByTestId('comment_listening_cancel'));
    });
    expect(speech.abort).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('Draft')).toHaveLength(2);
    expect(screen.queryByTestId('comment_listening')).toBeNull();
    // The next session goes in where the cancelled one started.
    await dictate('again');
    expect(screen.getAllByText('Draft again')).toHaveLength(2);
  });

  test('send while listening waits for the final words and sends them', async () => {
    const input = await renderComposer();
    await type(input, 'Looks good.');
    await pressMic();
    await emit('result', partial('ship it'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('composer_send'));
    });
    expect(speech.stop).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Looks good. ship it')).toBeNull();
    await emit('result', final('ship it'));
    await emit('end');
    expect(screen.getByText('Looks good. ship it')).toBeTruthy();
  });

  test('send while listening sends after 1.5 s when the final words do not come', async () => {
    const input = await renderComposer();
    await type(input, 'Looks good.');
    await pressMic();
    await emit('result', partial('ship it'));
    jest.useFakeTimers();
    await act(async () => {
      fireEvent.press(screen.getByTestId('composer_send'));
    });
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Looks good.')).toBeTruthy();
    expect(speech.abort).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('comment_listening')).toBeNull();
  });

  test('typing ends the session and keeps the words that showed', async () => {
    const input = await renderComposer();
    await pressMic();
    await emit('result', partial('hello there'));
    await type(input, 'hello there!');
    expect(speech.abort).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('comment_listening')).toBeNull();
    expect(screen.getAllByText('hello there!')).toHaveLength(2);
    expect(screen.queryByTestId('composer_partial')).toBeNull();
  });

  test('a refused microphone shows the denied warning with Settings, until the field is emptied', async () => {
    setSpeechRecognition({ granted: false });
    const input = await renderComposer();
    await pressMic();
    expect(screen.getByText('Microphone access is off.')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('comment_dictation_warning_settings'));
    });
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    await type(input, 'a');
    expect(screen.getByText('Microphone access is off.')).toBeTruthy();
    await type(input, '', 0);
    expect(screen.queryByText('Microphone access is off.')).toBeNull();
  });
});
