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

test('buildRequestProperties wraps event in docs array for MongoDBInsertMany', () => {
  const result = buildRequestProperties({
    requestType: 'MongoDBInsertMany',
    event: sampleEvent,
  });
  expect(result).toEqual({ docs: [sampleEvent] });
});

test('buildRequestProperties produces date-partitioned key for AwsS3PutObject', () => {
  const result = buildRequestProperties({
    requestType: 'AwsS3PutObject',
    event: sampleEvent,
  });
  expect(result.key).toBe('audit/2026-05-03/evt_abc.json');
  expect(result.contentType).toBe('application/json');
  expect(JSON.parse(result.body)).toEqual(sampleEvent);
});

test('buildRequestProperties throws on unsupported requestType', () => {
  expect(() =>
    buildRequestProperties({
      requestType: 'UnsupportedThing',
      event: sampleEvent,
    })
  ).toThrow('Audit logger does not support requestType "UnsupportedThing".');
});
