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

/**
 * Reads a text/event-stream body (the dev server's /api/reload) and calls onEvent with each event
 * as `{ event, data }`, the way EventSource dispatches them. React Native has no EventSource, so
 * the stream is read from a streaming fetch body. Resolves when the stream ends.
 *
 * @param {Object} params
 * @param {ReadableStream} params.body The response body.
 * @param {(event: { event: string, data: string }) => void} params.onEvent
 */
async function readEventStream({ body, onEvent }) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = null;
  let dataLines = [];

  function readLine(line) {
    if (line === '') {
      if (dataLines.length > 0 || event !== null) {
        onEvent({ event: event ?? 'message', data: dataLines.join('\n') });
      }
      event = null;
      dataLines = [];
      return;
    }
    if (line.startsWith(':')) {
      return;
    }
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
    if (field === 'event') {
      event = value;
    }
    if (field === 'data') {
      dataLines.push(value);
    }
  }

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r\n|\r|\n/);
    buffer = lines.pop();
    lines.forEach(readLine);
  }
}

export default readEventStream;
