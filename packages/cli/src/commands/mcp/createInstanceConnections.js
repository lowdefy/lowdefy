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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { LoggingMessageNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

// An MCP client per running dev server, kept while that server process lives.
// Opening it also opens the server's push stream (build results, restarts,
// browser and server errors), which is relayed to the agent labelled with the
// app it came from.
function createInstanceConnections({ cliVersion, onNotification }) {
  const connections = new Map();

  async function open({ instance, label }) {
    const client = new Client({ name: 'lowdefy-mcp', version: cliVersion });
    client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) =>
      onNotification({ ...notification.params, data: { app: label, ...notification.params.data } })
    );
    // The shim is the only client of this stream; it must not end the session
    // over a dropped push channel.
    client.onerror = () => {};
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${instance.url}/lowdefy-docs/mcp`))
    );
    return client;
  }

  async function get({ configDirectory, instance, label }) {
    const current = connections.get(configDirectory);
    if (current && current.pid === instance.pid && current.startedAt === instance.startedAt) {
      return current.client;
    }
    await current?.client.close().catch(() => {});
    const client = await open({ instance, label });
    connections.set(configDirectory, {
      client,
      pid: instance.pid,
      startedAt: instance.startedAt,
    });
    return client;
  }

  async function drop({ configDirectory }) {
    const current = connections.get(configDirectory);
    connections.delete(configDirectory);
    await current?.client.close().catch(() => {});
  }

  async function closeAll() {
    await Promise.all([...connections.keys()].map((configDirectory) => drop({ configDirectory })));
  }

  return { closeAll, drop, get };
}

export default createInstanceConnections;
