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

// HTTP to the dev server's walk session routes (and build-status), each
// answered as { status, body }. A network failure throws: the dev server is
// gone.
function createWalkClient({ url, fetchImpl = globalThis.fetch }) {
  async function call({ method, path, body }) {
    const response = await fetchImpl(`${url}${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { error: text };
    }
    return { status: response.status, body: parsed };
  }

  function walkPath(walkId) {
    return `/lowdefy-docs/explore/walks/${encodeURIComponent(walkId)}`;
  }

  return {
    open: (body) => call({ method: 'POST', path: '/lowdefy-docs/explore/walks', body }),
    step: ({ walkId, step }) =>
      call({ method: 'POST', path: `${walkPath(walkId)}/steps`, body: { step } }),
    close: ({ walkId }) => call({ method: 'DELETE', path: walkPath(walkId) }),
    buildId: async () => {
      const { body } = await call({ method: 'GET', path: '/lowdefy-docs/build-status' });
      return body?.buildId ?? null;
    },
  };
}

export default createWalkClient;
