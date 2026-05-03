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

import buildRequestProperties from './buildRequestProperties.js';

const sampleEvent = {
  id: 'evt_abc',
  timestamp: '2026-05-03T10:30:00.000Z',
  category: 'request',
  eventType: 'request.execute',
};

test('buildRequestProperties wraps single event in docs array for MongoDBInsertMany', () => {
  const result = buildRequestProperties({
    requestType: 'MongoDBInsertMany',
    events: [sampleEvent],
  });
  expect(result).toEqual({ docs: [sampleEvent] });
});

test('buildRequestProperties wraps multiple events for MongoDBInsertMany', () => {
  const evt2 = { ...sampleEvent, id: 'evt_def' };
  const result = buildRequestProperties({
    requestType: 'MongoDBInsertMany',
    events: [sampleEvent, evt2],
  });
  expect(result.docs).toHaveLength(2);
  expect(result.docs[0]).toBe(sampleEvent);
  expect(result.docs[1]).toBe(evt2);
});

test('buildRequestProperties produces date-partitioned key for single AwsS3PutObject event', () => {
  const result = buildRequestProperties({
    requestType: 'AwsS3PutObject',
    events: [sampleEvent],
  });
  expect(result.key).toBe('audit/2026-05-03/evt_abc.json');
  expect(result.contentType).toBe('application/json');
  expect(JSON.parse(result.body)).toEqual(sampleEvent);
});

test('buildRequestProperties produces NDJSON for multiple AwsS3PutObject events', () => {
  const evt2 = { ...sampleEvent, id: 'evt_def' };
  const result = buildRequestProperties({
    requestType: 'AwsS3PutObject',
    events: [sampleEvent, evt2],
  });
  expect(result.key).toBe('audit/2026-05-03/evt_abc-evt_def.ndjson');
  expect(result.contentType).toBe('application/x-ndjson');
  const lines = result.body.split('\n');
  expect(lines).toHaveLength(2);
  expect(JSON.parse(lines[0])).toEqual(sampleEvent);
  expect(JSON.parse(lines[1])).toEqual(evt2);
});

test('buildRequestProperties throws on unsupported requestType', () => {
  expect(() =>
    buildRequestProperties({
      requestType: 'UnsupportedThing',
      events: [sampleEvent],
    })
  ).toThrow('Audit logger does not support requestType "UnsupportedThing".');
});

test('buildRequestProperties throws on empty events array', () => {
  expect(() =>
    buildRequestProperties({
      requestType: 'MongoDBInsertMany',
      events: [],
    })
  ).toThrow('buildRequestProperties requires at least one event.');
});
