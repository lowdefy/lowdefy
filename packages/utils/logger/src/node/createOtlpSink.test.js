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

import createNodeLogger from './createNodeLogger.js';
import createOtlpSink from './createOtlpSink.js';

const endpoint = 'https://api.axiom.co/v1/logs';

function line({ level = 30, msg = 'hello', ...rest } = {}) {
  return `${JSON.stringify({ level, time: 1700000000000, msg, ...rest })}\n`;
}

function bodyOf(call) {
  return JSON.parse(call[1].body);
}

function recordsOf(call) {
  return bodyOf(call).resourceLogs[0].scopeLogs[0].logRecords;
}

let fetchMock;

beforeEach(() => {
  fetchMock = jest.fn(async () => ({ ok: true, status: 200 }));
  global.fetch = fetchMock;
});

afterEach(() => {
  jest.useRealTimers();
});

test('createOtlpSink exports a batch once batch.size lines are written', async () => {
  const sink = createOtlpSink({ endpoint, batch: { size: 3 } });
  sink.write(line({ msg: 'one' }));
  sink.write(line({ msg: 'two' }));
  expect(fetchMock).not.toHaveBeenCalled();
  sink.write(line({ msg: 'three' }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await sink.flush();
  expect(recordsOf(fetchMock.mock.calls[0])).toHaveLength(3);
});

test('createOtlpSink exports a partial batch after batch.flush_ms', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  const sink = createOtlpSink({ endpoint, batch: { size: 100, flush_ms: 2000 } });
  sink.write(line());
  jest.advanceTimersByTime(1999);
  expect(fetchMock).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(recordsOf(fetchMock.mock.calls[0])).toHaveLength(1);
});

test('createOtlpSink flush exports everything buffered and resolves after the post', async () => {
  const sink = createOtlpSink({ endpoint });
  sink.write(line());
  await sink.flush();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  // Nothing buffered - a second flush is a no-op.
  await sink.flush();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('createOtlpSink posts OTLP JSON with the configured headers and resource', async () => {
  const sink = createOtlpSink({
    endpoint,
    headers: { Authorization: 'Bearer token', 'X-Axiom-Dataset': 'lowdefy' },
    resource: { app_name: 'my_app', git_sha: 'abc123' },
  });
  sink.write(line({ event: 'request_completed', rid: 'r1', duration_ms: 12, success: true }));
  await sink.flush();
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe(endpoint);
  expect(options.method).toBe('POST');
  expect(options.headers).toEqual({
    'content-type': 'application/json',
    Authorization: 'Bearer token',
    'X-Axiom-Dataset': 'lowdefy',
  });
  const body = bodyOf(fetchMock.mock.calls[0]);
  expect(body.resourceLogs[0].resource.attributes).toEqual([
    { key: 'app_name', value: { stringValue: 'my_app' } },
    { key: 'git_sha', value: { stringValue: 'abc123' } },
  ]);
  const [record] = body.resourceLogs[0].scopeLogs[0].logRecords;
  expect(record.timeUnixNano).toBe('1700000000000000000');
  expect(record.body).toEqual({ stringValue: 'hello' });
  expect(record.attributes).toEqual([
    { key: 'event', value: { stringValue: 'request_completed' } },
    { key: 'rid', value: { stringValue: 'r1' } },
    { key: 'duration_ms', value: { intValue: '12' } },
    { key: 'success', value: { boolValue: true } },
  ]);
});

test('createOtlpSink drops resource fields from the per-record attributes', async () => {
  const sink = createOtlpSink({ endpoint, resource: { app_name: 'my_app' } });
  sink.write(line({ app_name: 'my_app', rid: 'r1' }));
  await sink.flush();
  expect(recordsOf(fetchMock.mock.calls[0])[0].attributes).toEqual([
    { key: 'rid', value: { stringValue: 'r1' } },
  ]);
});

test('createOtlpSink maps pino levels to OTLP severity numbers', async () => {
  const sink = createOtlpSink({ endpoint });
  [10, 20, 30, 40, 50, 60].forEach((level) => sink.write(line({ level })));
  await sink.flush();
  expect(
    recordsOf(fetchMock.mock.calls[0]).map(({ severityNumber, severityText }) => [
      severityNumber,
      severityText,
    ])
  ).toEqual([
    [1, 'TRACE'],
    [5, 'DEBUG'],
    [9, 'INFO'],
    [13, 'WARN'],
    [17, 'ERROR'],
    [21, 'FATAL'],
  ]);
});

test('createOtlpSink retries once, then drops the batch without throwing', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  fetchMock.mockRejectedValue(new Error('network down'));
  const sink = createOtlpSink({ endpoint });
  sink.write(line());
  await expect(sink.flush()).resolves.toBeDefined();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain('network down');
  warn.mockRestore();
});

test('createOtlpSink retries a non-2xx response and warns with the status', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  fetchMock.mockResolvedValue({ ok: false, status: 401 });
  const sink = createOtlpSink({ endpoint });
  sink.write(line());
  await sink.flush();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(warn.mock.calls[0][0]).toContain('401');
  warn.mockRestore();
});

test('createOtlpSink warns at most once a minute while the endpoint is failing', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  fetchMock.mockRejectedValue(new Error('network down'));
  const sink = createOtlpSink({ endpoint });
  sink.write(line());
  await sink.flush();
  sink.write(line());
  await sink.flush();
  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(warn).toHaveBeenCalledTimes(1);
  warn.mockRestore();
});

test('createNodeLogger with otlp writes to both stdout and the exporter, and exposes flushOtlp', async () => {
  const lines = [];
  const destination = { write: (data) => lines.push(JSON.parse(data)) };
  const logger = createNodeLogger({ destination, otlp: { endpoint } });
  const child = logger.child({ rid: 'r1' });
  child.info({ event: 'request_completed' }, 'done');
  expect(lines).toHaveLength(1);
  expect(lines[0].rid).toBe('r1');
  await child.flushOtlp();
  const [record] = recordsOf(fetchMock.mock.calls[0]);
  expect(record.body).toEqual({ stringValue: 'done' });
  expect(record.attributes).toContainEqual({ key: 'rid', value: { stringValue: 'r1' } });
});

test('createOtlpSink maps nested, list and empty attribute values', async () => {
  const sink = createOtlpSink({ endpoint });
  sink.write(
    line({
      error: { name: 'ConfigError', message: 'boom' },
      roles: ['admin', 'user'],
      rate: 0.25,
      hint: null,
    })
  );
  await sink.flush();
  expect(recordsOf(fetchMock.mock.calls[0])[0].attributes).toEqual([
    {
      key: 'error',
      value: {
        kvlistValue: {
          values: [
            { key: 'name', value: { stringValue: 'ConfigError' } },
            { key: 'message', value: { stringValue: 'boom' } },
          ],
        },
      },
    },
    {
      key: 'roles',
      value: {
        arrayValue: { values: [{ stringValue: 'admin' }, { stringValue: 'user' }] },
      },
    },
    { key: 'rate', value: { doubleValue: 0.25 } },
    { key: 'hint', value: {} },
  ]);
});
