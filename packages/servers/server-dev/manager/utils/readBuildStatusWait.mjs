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

function parseJson(body) {
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    return null;
  }
}

function isBuildStatusWaitCall(message) {
  return (
    message?.method === 'tools/call' &&
    message.params?.name === 'lowdefy_build_status' &&
    message.params?.arguments?.wait === true
  );
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Whether a proxied request is a build-status wait: GET build-status?wait=true,
// or the lowdefy_build_status MCP tool called with wait: true. Telling the
// second apart means reading the body of every MCP POST (small JSON-RPC
// messages), so it is returned for the proxy to forward; body is undefined
// for any other request, whose body is still unread.
async function readBuildStatusWait({ basePath, req }) {
  const { pathname, searchParams } = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && pathname === `${basePath}/lowdefy-docs/build-status`) {
    return { wait: searchParams.get('wait') === 'true', body: undefined };
  }
  if (req.method !== 'POST' || pathname !== `${basePath}/lowdefy-docs/mcp`) {
    return { wait: false, body: undefined };
  }
  const body = await readBody(req);
  return { wait: [parseJson(body)].flat().some(isBuildStatusWaitCall), body };
}

export default readBuildStatusWait;
