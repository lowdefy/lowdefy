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

import http from 'node:http';

// A local stand-in for treg, for tests: no test ever calls treg.to. It listens on a random
// loopback port, records every request, and answers with `handler(request)`, which returns
// { status, headers, body } (a non-string body is sent as JSON).
async function startMockTreg(handler) {
  const requests = [];
  const state = { handler };
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      const url = new URL(req.url, 'http://localhost');
      const text = Buffer.concat(chunks).toString('utf8');
      const request = {
        method: req.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
        searchParams: url.searchParams,
        headers: req.headers,
        body: text === '' ? undefined : JSON.parse(text),
      };
      requests.push(request);
      const answer = (await state.handler(request)) ?? { status: 200, body: {} };
      if (answer.hang === true) return;
      const body =
        typeof answer.body === 'string' ? answer.body : JSON.stringify(answer.body ?? null);
      res.writeHead(answer.status ?? 200, {
        'content-type': 'application/json',
        ...answer.headers,
      });
      res.end(body);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    setHandler(next) {
      state.handler = next;
    },
    close() {
      server.closeAllConnections();
      return new Promise((resolve) => server.close(resolve));
    },
  };
}

export default startMockTreg;
