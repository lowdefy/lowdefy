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

const mockTranscribe = jest.fn();

jest.unstable_mockModule('ai', () => ({
  experimental_transcribe: mockTranscribe,
}));

const { default: transcribeAudioParts } = await import('./transcribeAudioParts.js');

const mockTranscriptionModel = jest.fn((model) => ({ transcriptionModelId: model }));

function createContext({ provider } = {}) {
  return {
    getConnectionForAgent: jest.fn().mockResolvedValue({
      provider: provider ?? { transcription: mockTranscriptionModel },
    }),
  };
}

function createAgent(properties = {}) {
  return {
    agentId: 'test_agent',
    '~k': 42,
    properties: { model: 'test-model', ...properties },
  };
}

const transcriptionConfig = { connectionId: 'openai', model: 'whisper-1' };

function audioPart(base64) {
  return { type: 'file', url: base64, mediaType: 'audio/ogg' };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockTranscribe.mockResolvedValue({ text: 'transcribed text' });
});

test('transcribeAudioParts returns messages unchanged when transcription is not configured', async () => {
  const context = createContext();
  const messages = [{ role: 'user', parts: [audioPart('YXVkaW8tbm8tY29uZmln')] }];
  const result = await transcribeAudioParts({ agent: createAgent(), messages, context });
  expect(result).toBe(messages);
  expect(context.getConnectionForAgent).not.toHaveBeenCalled();
  expect(mockTranscribe).not.toHaveBeenCalled();
});

test('transcribeAudioParts returns messages unchanged when no user message has audio parts', async () => {
  const context = createContext();
  const messages = [
    { role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
    { role: 'assistant', parts: [{ type: 'text', text: 'Hello' }] },
    { role: 'user', parts: [{ type: 'file', url: 'aW1n', mediaType: 'image/png' }] },
  ];
  const result = await transcribeAudioParts({
    agent: createAgent({ transcription: transcriptionConfig }),
    messages,
    context,
  });
  expect(result).toBe(messages);
  expect(context.getConnectionForAgent).not.toHaveBeenCalled();
  expect(mockTranscribe).not.toHaveBeenCalled();
});

test('transcribeAudioParts replaces audio parts with transcript text and preserves other parts', async () => {
  const context = createContext();
  mockTranscribe.mockResolvedValue({ text: 'What is the weather?' });
  const messages = [
    { role: 'assistant', parts: [{ type: 'text', text: 'Hello' }] },
    {
      role: 'user',
      parts: [
        { type: 'text', text: 'Listen to this:' },
        audioPart('YXVkaW8tcmVwbGFjZQ=='),
        { type: 'file', url: 'aW1hZ2U=', mediaType: 'image/png' },
      ],
    },
  ];
  const result = await transcribeAudioParts({
    agent: createAgent({ transcription: transcriptionConfig }),
    messages,
    context,
  });
  expect(result[0]).toBe(messages[0]);
  expect(result[1].parts).toEqual([
    { type: 'text', text: 'Listen to this:' },
    { type: 'text', text: 'What is the weather?' },
    { type: 'file', url: 'aW1hZ2U=', mediaType: 'image/png' },
  ]);
  expect(context.getConnectionForAgent).toHaveBeenCalledWith({
    agentConfig: { connectionId: 'openai', '~k': 42 },
  });
  expect(mockTranscriptionModel).toHaveBeenCalledWith('whisper-1');
  expect(mockTranscribe).toHaveBeenCalledWith({
    model: { transcriptionModelId: 'whisper-1' },
    audio: 'YXVkaW8tcmVwbGFjZQ==',
  });
});

test('transcribeAudioParts transcribes audio in all user messages', async () => {
  const context = createContext();
  mockTranscribe
    .mockResolvedValueOnce({ text: 'first transcript' })
    .mockResolvedValueOnce({ text: 'second transcript' });
  const messages = [
    { role: 'user', parts: [audioPart('Zmlyc3QtYXVkaW8=')] },
    { role: 'assistant', parts: [{ type: 'text', text: 'Reply' }] },
    { role: 'user', parts: [audioPart('c2Vjb25kLWF1ZGlv')] },
  ];
  const result = await transcribeAudioParts({
    agent: createAgent({ transcription: transcriptionConfig }),
    messages,
    context,
  });
  expect(result[0].parts).toEqual([{ type: 'text', text: 'first transcript' }]);
  expect(result[2].parts).toEqual([{ type: 'text', text: 'second transcript' }]);
  expect(mockTranscribe).toHaveBeenCalledTimes(2);
});

test('transcribeAudioParts passes http urls as URL instances', async () => {
  const context = createContext();
  const messages = [
    {
      role: 'user',
      parts: [{ type: 'file', url: 'https://example.com/voice-note.ogg', mediaType: 'audio/ogg' }],
    },
  ];
  await transcribeAudioParts({
    agent: createAgent({ transcription: transcriptionConfig }),
    messages,
    context,
  });
  const { audio } = mockTranscribe.mock.calls[0][0];
  expect(audio).toBeInstanceOf(URL);
  expect(audio.href).toEqual('https://example.com/voice-note.ogg');
});

test('transcribeAudioParts throws when the provider does not support transcription', async () => {
  const context = createContext({ provider: {} });
  const messages = [{ role: 'user', parts: [audioPart('bm8tcHJvdmlkZXI=')] }];
  await expect(
    transcribeAudioParts({
      agent: createAgent({ transcription: transcriptionConfig }),
      messages,
      context,
    })
  ).rejects.toThrow(
    'Agent "test_agent" transcription connection "openai" uses a provider that does not support transcription.'
  );
  expect(mockTranscribe).not.toHaveBeenCalled();
});

test('transcribeAudioParts propagates transcription failures with agent context', async () => {
  const context = createContext();
  mockTranscribe.mockRejectedValue(new Error('rate limited'));
  const messages = [{ role: 'user', parts: [audioPart('ZmFpbC1hdWRpbw==')] }];
  await expect(
    transcribeAudioParts({
      agent: createAgent({ transcription: transcriptionConfig }),
      messages,
      context,
    })
  ).rejects.toThrow('Transcription failed for agent "test_agent": rate limited');
});

test('transcribeAudioParts caches transcripts by audio content', async () => {
  const context = createContext();
  mockTranscribe.mockResolvedValue({ text: 'cached transcript' });
  const part = audioPart('Y2FjaGVkLWF1ZGlv');
  const messages = [{ role: 'user', parts: [{ ...part }] }];
  const first = await transcribeAudioParts({
    agent: createAgent({ transcription: transcriptionConfig }),
    messages,
    context,
  });
  const second = await transcribeAudioParts({
    agent: createAgent({ transcription: transcriptionConfig }),
    messages: [{ role: 'user', parts: [{ ...part }] }],
    context,
  });
  expect(first[0].parts).toEqual([{ type: 'text', text: 'cached transcript' }]);
  expect(second[0].parts).toEqual([{ type: 'text', text: 'cached transcript' }]);
  expect(mockTranscribe).toHaveBeenCalledTimes(1);
});

test('transcribeAudioParts forwards providerOptions to the AI SDK', async () => {
  const context = createContext();
  const messages = [{ role: 'user', parts: [audioPart('b3B0aW9ucy1hdWRpbw==')] }];
  await transcribeAudioParts({
    agent: createAgent({
      transcription: {
        ...transcriptionConfig,
        providerOptions: { openai: { language: 'en' } },
      },
    }),
    messages,
    context,
  });
  expect(mockTranscribe).toHaveBeenCalledWith({
    model: { transcriptionModelId: 'whisper-1' },
    audio: 'b3B0aW9ucy1hdWRpbw==',
    providerOptions: { openai: { language: 'en' } },
  });
});
