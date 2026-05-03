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

function datePartition(timestamp) {
  return timestamp.slice(0, 10);
}

function buildRequestProperties({ requestType, events }) {
  const eventList = Array.isArray(events) ? events : [events];
  if (eventList.length === 0) {
    throw new Error('buildRequestProperties requires at least one event.');
  }

  if (requestType === 'MongoDBInsertMany') {
    return { docs: eventList };
  }
  if (requestType === 'AwsS3PutObject') {
    if (eventList.length === 1) {
      const event = eventList[0];
      return {
        key: `audit/${datePartition(event.timestamp)}/${event.id}.json`,
        body: JSON.stringify(event),
        contentType: 'application/json',
      };
    }
    const first = eventList[0];
    const last = eventList[eventList.length - 1];
    return {
      key: `audit/${datePartition(first.timestamp)}/${first.id}-${last.id}.ndjson`,
      body: eventList.map((evt) => JSON.stringify(evt)).join('\n'),
      contentType: 'application/x-ndjson',
    };
  }
  throw new Error(`Audit logger does not support requestType "${requestType}".`);
}

export default buildRequestProperties;
