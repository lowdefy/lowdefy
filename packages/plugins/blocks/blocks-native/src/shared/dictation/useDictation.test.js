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
import { AppState, Platform } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import {
  emitSpeechEvent,
  ExpoSpeechRecognitionModule as speech,
  setSpeechRecognition,
} from '../../test/expoSpeechRecognition.js';
import useDictation from './useDictation.js';

function partialResult(transcript) {
  return { isFinal: false, results: [{ transcript, confidence: 0, segments: [] }] };
}

function finalResult(transcript) {
  return { isFinal: true, results: [{ transcript, confidence: 0.9, segments: [] }] };
}

async function emit(name, event) {
  await act(async () => {
    emitSpeechEvent(name, event);
  });
}

async function renderDictation(props = {}) {
  const onFinal = jest.fn();
  const hook = await renderHook((hookProps) => useDictation(hookProps), {
    initialProps: { hints: ['Sam Taylor', 'Ana'], onFinal, ...props },
  });
  // Let the availability check settle.
  await act(async () => {});
  return { ...hook, onFinal };
}

async function startListening(result) {
  await act(async () => {
    await result.current.start();
  });
}

beforeEach(() => {
  setSpeechRecognition();
});

afterEach(() => {
  jest.useRealTimers();
});

test('useDictation is available where the phone recognises speech on the device', async () => {
  const { result } = await renderDictation();
  expect(result.current.available).toBe(true);
  expect(result.current.status).toBe('idle');
  expect(result.current.partial).toBe('');
  expect(result.current.warning).toBe(null);
});

test('useDictation is unavailable where the phone has no recogniser, and start asks for nothing', async () => {
  setSpeechRecognition({ available: false });
  const { result } = await renderDictation();
  expect(result.current.available).toBe(false);
  await startListening(result);
  expect(speech.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(speech.start).not.toHaveBeenCalled();
});

test('useDictation is unavailable where the phone can only recognise speech on a server', async () => {
  setSpeechRecognition({ onDevice: false });
  const { result } = await renderDictation();
  expect(result.current.available).toBe(false);
});

test('useDictation is unavailable on Android without the language model of the phone', async () => {
  const os = Platform.OS;
  Platform.OS = 'android';
  setSpeechRecognition({ installedLocales: ['af-ZA'] });
  const resolvedOptions = jest
    .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
    .mockReturnValue({ locale: 'en-ZA' });
  try {
    const { result } = await renderDictation();
    expect(result.current.available).toBe(false);
  } finally {
    Platform.OS = os;
    resolvedOptions.mockRestore();
  }
});

test('useDictation dictates on Android in an installed locale of the phone language', async () => {
  const os = Platform.OS;
  Platform.OS = 'android';
  setSpeechRecognition({ installedLocales: ['af-ZA', 'en-US'] });
  const resolvedOptions = jest
    .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
    .mockReturnValue({ locale: 'en-ZA' });
  try {
    const { result } = await renderDictation();
    expect(result.current.available).toBe(true);
    await startListening(result);
    expect(speech.start.mock.calls[0][0].lang).toBe('en-US');
    await emit('end');
  } finally {
    Platform.OS = os;
    resolvedOptions.mockRestore();
  }
});

test('useDictation is unavailable while disabled', async () => {
  const { result, rerender, onFinal } = await renderDictation({ disabled: true });
  expect(result.current.available).toBe(false);
  await rerender({ disabled: false, onFinal });
  expect(result.current.available).toBe(true);
});

test('useDictation warns denied when the permission is refused, and does not start', async () => {
  setSpeechRecognition({ granted: false });
  const { result } = await renderDictation();
  await startListening(result);
  expect(result.current.warning).toBe('denied');
  expect(result.current.status).toBe('idle');
  expect(speech.start).not.toHaveBeenCalled();
  await act(async () => result.current.clearWarning());
  expect(result.current.warning).toBe(null);
});

test('useDictation starts on the device only, with the hints and the input level', async () => {
  const { result } = await renderDictation();
  await startListening(result);
  expect(result.current.status).toBe('listening');
  expect(speech.start).toHaveBeenCalledTimes(1);
  expect(speech.start.mock.calls[0][0]).toMatchObject({
    addsPunctuation: true,
    contextualStrings: ['Sam Taylor', 'Ana'],
    continuous: true,
    interimResults: true,
    iosTaskHint: 'dictation',
    requiresOnDeviceRecognition: true,
    volumeChangeEventOptions: { enabled: true },
  });
  await emit('volumechange', { value: 5 });
  expect(result.current.level).toBe(0.5);
  await emit('end');
  expect(result.current.status).toBe('idle');
  expect(result.current.level).toBe(0);
});

test('useDictation shows partial words, then passes the one final result on iOS', async () => {
  const { result, onFinal } = await renderDictation();
  await startListening(result);
  await emit('result', partialResult('for Sam'));
  expect(result.current.partial).toBe('for Sam');
  await emit('result', partialResult('for Sam can you check'));
  expect(result.current.partial).toBe('for Sam can you check');
  expect(onFinal).not.toHaveBeenCalled();

  await act(async () => result.current.stop());
  expect(result.current.status).toBe('stopping');
  expect(speech.stop).toHaveBeenCalledTimes(1);
  await emit('result', finalResult('for Sam, can you check the gate?'));
  expect(onFinal).toHaveBeenCalledTimes(1);
  expect(onFinal).toHaveBeenCalledWith('for Sam, can you check the gate?');
  expect(result.current.partial).toBe('');
  await emit('end');
  expect(result.current.status).toBe('idle');
  expect(onFinal).toHaveBeenCalledTimes(1);
});

test('useDictation passes each Android final segment once', async () => {
  const { result, onFinal } = await renderDictation();
  await startListening(result);
  await emit('result', partialResult('check the'));
  await emit('result', finalResult('Check the gate.'));
  await emit('result', partialResult('then the'));
  await emit('result', finalResult('Then the fence.'));
  expect(onFinal.mock.calls).toEqual([['Check the gate.'], ['Then the fence.']]);
  expect(result.current.partial).toBe('');
  await act(async () => result.current.stop());
  await emit('end');
  expect(onFinal).toHaveBeenCalledTimes(2);
});

test('useDictation passes iOS 18 segments without the space iOS puts before later ones', async () => {
  const { result, onFinal } = await renderDictation();
  await startListening(result);
  await emit('result', finalResult('Check the gate.'));
  await emit('result', partialResult(' Then the'));
  expect(result.current.partial).toBe('Then the');
  await emit('result', finalResult(' Then the fence.'));
  expect(onFinal.mock.calls).toEqual([['Check the gate.'], ['Then the fence.']]);
});

test('useDictation commits words still partial when the session ends without a final result', async () => {
  const { result, onFinal } = await renderDictation();
  await startListening(result);
  await emit('result', partialResult('check the gate'));
  await emit('end');
  expect(onFinal).toHaveBeenCalledWith('check the gate');
});

test('useDictation cancel aborts and passes nothing to onFinal', async () => {
  const { result, onFinal } = await renderDictation();
  await startListening(result);
  await emit('result', partialResult('never mind'));
  await act(async () => result.current.cancel());
  expect(speech.abort).toHaveBeenCalledTimes(1);
  expect(result.current.partial).toBe('');
  expect(result.current.status).toBe('idle');
  expect(result.current.warning).toBe(null);
  // A final result the recogniser still sends after the abort is dropped too.
  await emit('result', finalResult('never mind'));
  expect(onFinal).not.toHaveBeenCalled();
});

test('useDictation finish resolves once the final result is committed', async () => {
  const { result, onFinal } = await renderDictation();
  await startListening(result);
  await emit('result', partialResult('send this'));
  let finished = false;
  await act(async () => {
    result.current.finish().then(() => {
      finished = true;
    });
  });
  expect(speech.stop).toHaveBeenCalledTimes(1);
  expect(finished).toBe(false);
  await emit('result', finalResult('Send this.'));
  expect(onFinal).toHaveBeenCalledWith('Send this.');
  expect(finished).toBe(true);
  await emit('end');
});

test('useDictation finish resolves after 1.5 s when no final result comes', async () => {
  jest.useFakeTimers();
  const { result } = await renderDictation();
  await startListening(result);
  let finished = false;
  await act(async () => {
    result.current.finish().then(() => {
      finished = true;
    });
  });
  await act(async () => {
    jest.advanceTimersByTime(1400);
  });
  expect(finished).toBe(false);
  await act(async () => {
    jest.advanceTimersByTime(100);
  });
  expect(finished).toBe(true);
  await emit('end');
});

test('useDictation finish resolves at once when idle', async () => {
  const { result } = await renderDictation();
  await act(async () => {
    await result.current.finish();
  });
  expect(speech.stop).not.toHaveBeenCalled();
});

test('useDictation stops after 20 s without words', async () => {
  jest.useFakeTimers();
  const { result } = await renderDictation();
  await startListening(result);
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  await emit('result', partialResult('check'));
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(speech.stop).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(speech.stop).toHaveBeenCalledTimes(1);
  expect(result.current.status).toBe('stopping');
  await emit('end');
});

test('useDictation stops when the app goes to the background', async () => {
  const { result } = await renderDictation();
  await startListening(result);
  const [, onChange] = AppState.addEventListener.mock.calls.at(-1);
  await act(async () => onChange('inactive'));
  expect(speech.stop).not.toHaveBeenCalled();
  await act(async () => onChange('background'));
  expect(speech.stop).toHaveBeenCalledTimes(1);
  await emit('end');
});

test('useDictation keeps a session the Android permission prompt sends to the background', async () => {
  let grant;
  speech.requestPermissionsAsync.mockReturnValue(
    new Promise((resolve) => {
      grant = resolve;
    })
  );
  const { result } = await renderDictation();
  let started;
  await act(async () => {
    started = result.current.start();
  });
  const [, onChange] = AppState.addEventListener.mock.calls.at(-1);
  await act(async () => onChange('background'));
  await act(async () => onChange('active'));
  await act(async () => {
    grant({ granted: true, status: 'granted' });
    await started;
  });
  expect(result.current.status).toBe('listening');
  expect(speech.start).toHaveBeenCalledTimes(1);
  expect(speech.stop).not.toHaveBeenCalled();
});

test('useDictation aborts when the host unmounts, and frees the mic for another input', async () => {
  const first = await renderDictation();
  await startListening(first.result);
  await emit('result', partialResult('half a'));
  await act(async () => first.unmount());
  expect(speech.abort).toHaveBeenCalledTimes(1);
  expect(first.onFinal).not.toHaveBeenCalled();

  const second = await renderDictation();
  await startListening(second.result);
  expect(second.result.current.status).toBe('listening');
  expect(speech.start).toHaveBeenCalledTimes(2);
  await emit('end');
});

test('useDictation ends the first input when a second input takes the mic', async () => {
  const first = await renderDictation();
  const second = await renderDictation();
  await startListening(first.result);
  await emit('result', partialResult('first words'));

  let started;
  await act(async () => {
    started = second.result.current.start();
  });
  // The first input stops and keeps its words; the second waits for its session to end.
  expect(speech.stop).toHaveBeenCalledTimes(1);
  expect(first.result.current.status).toBe('stopping');
  expect(speech.start).toHaveBeenCalledTimes(1);

  await emit('result', finalResult('First words.'));
  await emit('end');
  await act(async () => started);
  expect(first.onFinal).toHaveBeenCalledWith('First words.');
  expect(first.result.current.status).toBe('idle');
  expect(second.result.current.status).toBe('listening');
  expect(speech.start).toHaveBeenCalledTimes(2);

  // The recogniser's events now belong to the second input only.
  await emit('result', partialResult('second'));
  expect(second.result.current.partial).toBe('second');
  expect(first.result.current.partial).toBe('');
  await emit('result', finalResult('Second.'));
  expect(second.onFinal).toHaveBeenCalledWith('Second.');
  expect(first.onFinal).toHaveBeenCalledTimes(1);
  await emit('end');
});

test('useDictation ends quietly when nothing is said', async () => {
  const { result, onFinal } = await renderDictation();
  await startListening(result);
  await emit('error', { error: 'no-speech', message: 'No speech was detected.' });
  await emit('end');
  expect(result.current.warning).toBe(null);
  expect(result.current.status).toBe('idle');
  expect(onFinal).not.toHaveBeenCalled();
});

test('useDictation warns failed for other errors, and the warning clears on the next start', async () => {
  const { result } = await renderDictation();
  await startListening(result);
  await emit('error', { error: 'audio-capture', message: 'Audio recording error.' });
  await emit('end');
  expect(result.current.warning).toBe('failed');
  await startListening(result);
  expect(result.current.warning).toBe(null);
  await emit('end');
});

test('useDictation warns denied when the recogniser refuses the permission', async () => {
  const { result } = await renderDictation();
  await startListening(result);
  await emit('error', { error: 'not-allowed', message: 'Permission denied.' });
  await emit('end');
  expect(result.current.warning).toBe('denied');
});
