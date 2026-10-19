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
import { act, renderHook } from '@testing-library/react-native';

import {
  emitSpeechEvent,
  ExpoSpeechRecognitionModule as speech,
  setSpeechRecognition,
} from '../../test/expoSpeechRecognition.js';
import getRecognizer, { installDictationSource } from './getRecognizer.js';
import useDictation from './useDictation.js';

function createReads(answers) {
  const queues = { transcript: [...(answers.transcript ?? [])] };
  return (name) => {
    if (name === 'transcript') return queues.transcript.shift();
    return answers[name];
  };
}

async function renderDictation() {
  const onFinal = jest.fn();
  const hook = await renderHook((props) => useDictation(props), {
    initialProps: { hints: [], onFinal },
  });
  await act(async () => {});
  return { ...hook, onFinal };
}

async function start(result) {
  await act(async () => {
    await result.current.start();
  });
}

async function advance(ms) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

let remove = null;

beforeEach(() => {
  setSpeechRecognition({ available: false });
  jest.useFakeTimers();
});

afterEach(() => {
  remove?.();
  remove = null;
  jest.useRealTimers();
});

test('getRecognizer is expo-speech-recognition while nothing is installed', async () => {
  setSpeechRecognition();
  expect(getRecognizer()).toBe(speech);
  const { result } = await renderDictation();
  await start(result);
  expect(speech.start).toHaveBeenCalledTimes(1);
});

test('an installed source makes dictation available without the phone’s recogniser', async () => {
  remove = installDictationSource(createReads({}));
  const { result } = await renderDictation();
  expect(result.current.available).toBe(true);
  expect(speech.isRecognitionAvailable).not.toHaveBeenCalled();
});

test('an installed source plays the queued partials, then the final into onFinal, then ends', async () => {
  remove = installDictationSource(
    createReads({ transcript: [{ partials: ['for', 'for Sam'], final: 'for Sam, can you look' }] })
  );
  const { onFinal, result } = await renderDictation();
  await start(result);
  expect(result.current.status).toBe('listening');
  await advance(450);
  expect(result.current.partial).toBe('for');
  expect(result.current.level).toBeGreaterThan(0);
  await advance(150);
  expect(result.current.partial).toBe('for Sam');
  expect(onFinal).not.toHaveBeenCalled();
  await advance(300);
  expect(onFinal.mock.calls).toEqual([['for Sam, can you look']]);
  expect(result.current.status).toBe('idle');
  expect(speech.start).not.toHaveBeenCalled();
});

test('stop delivers the queued final at once', async () => {
  remove = installDictationSource(createReads({ transcript: [{ final: 'ship it' }] }));
  const { onFinal, result } = await renderDictation();
  await start(result);
  await act(async () => {
    result.current.stop();
  });
  expect(onFinal.mock.calls).toEqual([['ship it']]);
  expect(result.current.status).toBe('idle');
});

test('cancel drops the queued transcript', async () => {
  remove = installDictationSource(createReads({ transcript: [{ final: 'ship it' }] }));
  const { onFinal, result } = await renderDictation();
  await start(result);
  await act(async () => {
    result.current.cancel();
  });
  await advance(1000);
  expect(onFinal).not.toHaveBeenCalled();
  expect(result.current.status).toBe('idle');
  expect(result.current.warning).toBe(null);
});

test('an injected not-allowed error gives denied', async () => {
  remove = installDictationSource(createReads({ transcript: [{ error: 'not-allowed' }] }));
  const { onFinal, result } = await renderDictation();
  await start(result);
  await advance(300);
  expect(result.current.warning).toBe('denied');
  expect(result.current.status).toBe('idle');
  expect(onFinal).not.toHaveBeenCalled();
});

test('an injected denied microphone permission gives denied', async () => {
  remove = installDictationSource(
    createReads({ 'permission:microphone': 'denied', transcript: [{ final: 'never heard' }] })
  );
  const { onFinal, result } = await renderDictation();
  await start(result);
  expect(result.current.warning).toBe('denied');
  expect(result.current.status).toBe('idle');
  expect(onFinal).not.toHaveBeenCalled();
});

test('a queued transcript is granted without asking the phone', async () => {
  remove = installDictationSource(createReads({ transcript: [{ final: 'ship it' }] }));
  const { result } = await renderDictation();
  await start(result);
  expect(speech.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(result.current.status).toBe('listening');
});

test('a session with nothing queued asks the phone and listens on its microphone', async () => {
  setSpeechRecognition({ available: false });
  remove = installDictationSource(createReads({}));
  const { onFinal, result } = await renderDictation();
  expect(result.current.available).toBe(true);
  await start(result);
  expect(speech.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(speech.start).toHaveBeenCalledTimes(1);
  expect(speech.start.mock.calls[0][0].requiresOnDeviceRecognition).toBe(true);
  await act(async () => {
    emitSpeechEvent('result', { isFinal: false, results: [{ transcript: 'ship' }] });
  });
  expect(result.current.partial).toBe('ship');
  await act(async () => {
    result.current.stop();
  });
  expect(speech.stop).toHaveBeenCalledTimes(1);
  await act(async () => {
    emitSpeechEvent('result', { isFinal: true, results: [{ transcript: 'ship it' }] });
    emitSpeechEvent('end');
  });
  expect(onFinal.mock.calls).toEqual([['ship it']]);
  expect(result.current.status).toBe('idle');
});

test('a session with nothing queued is refused when the phone refuses the microphone', async () => {
  setSpeechRecognition({ granted: false });
  remove = installDictationSource(createReads({}));
  const { result } = await renderDictation();
  await start(result);
  expect(result.current.warning).toBe('denied');
  expect(speech.start).not.toHaveBeenCalled();
});

test('removing the source goes back to expo-speech-recognition', () => {
  const removeSource = installDictationSource(createReads({}));
  expect(getRecognizer()).not.toBe(speech);
  removeSource();
  expect(getRecognizer()).toBe(speech);
});
