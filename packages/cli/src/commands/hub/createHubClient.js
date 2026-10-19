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

import createLineReader from './createLineReader.js';

function createHubClient({ socket }) {
  let nextId = 1;
  const pending = new Map();

  socket.setEncoding('utf8');
  socket.on(
    'data',
    createLineReader({
      onMessage: (message) => {
        const request = pending.get(message.id);
        if (request === undefined) {
          return;
        }
        pending.delete(message.id);
        if (message.error) {
          request.reject(new Error(message.error.message));
          return;
        }
        request.resolve(message.result);
      },
    })
  );
  socket.on('close', () => {
    pending.forEach((request) =>
      request.reject(new Error('The Lowdefy hub closed the connection.'))
    );
    pending.clear();
  });

  function request(method, params = {}) {
    const id = nextId;
    nextId += 1;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      socket.write(`${JSON.stringify({ id, method, params })}\n`);
    });
  }

  return {
    close: () => socket.end(),
    onClose: (callback) => socket.on('close', callback),
    request,
  };
}

export default createHubClient;
