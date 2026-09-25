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

const DIRECTORY_PROPERTY = {
  type: 'string',
  description:
    "The app to act on: its directory or any path inside it, absolute or relative to the session's working directory. Defaults to the session's working directory. Pass your own working directory whenever you work in a different git worktree from the session (for example as a subagent), and the app's directory when the repository holds several apps.",
};

const lifecycleTools = [
  {
    name: 'lowdefy_dev_start',
    description:
      "Start this app's dev server, or return it if it is already running, and wait until it is ready. Every other lowdefy_ tool starts the server on its own, so call this directly to restart it: restart: true after changing local plugin code or .env, or when the server seems stuck; clean: true also deletes the build directory first. Never run `lowdefy dev` yourself, and never pick a port.",
    inputSchema: {
      type: 'object',
      properties: {
        directory: DIRECTORY_PROPERTY,
        restart: { type: 'boolean', description: 'Restart the server if it is running.' },
        clean: {
          type: 'boolean',
          description: 'Delete the build directory before starting. Implies a restart.',
        },
      },
    },
  },
  {
    name: 'lowdefy_dev_stop',
    description:
      "Stop this app's dev server if the Lowdefy hub started it. A server the user runs in their own terminal is never stopped. Never kill dev servers by port or process name.",
    inputSchema: { type: 'object', properties: { directory: DIRECTORY_PROPERTY } },
  },
  {
    name: 'lowdefy_dev_status',
    description:
      "Report this app's dev server - owner (hub or the user's terminal), state, URL, build status - without starting it.",
    inputSchema: { type: 'object', properties: { directory: DIRECTORY_PROPERTY } },
  },
  {
    name: 'lowdefy_dev_logs',
    description:
      "Read the recent output of this app's dev server (hub-started servers only - a terminal server's output is in the user's terminal).",
    inputSchema: {
      type: 'object',
      properties: {
        directory: DIRECTORY_PROPERTY,
        lines: { type: 'integer', minimum: 1, description: 'How many lines. Default 100.' },
        grep: {
          type: 'string',
          description: 'Only lines containing this text (case-insensitive).',
        },
      },
    },
  },
  {
    name: 'lowdefy_dev_list',
    description:
      'List the dev servers of every app in this checkout, and every server the Lowdefy hub runs in other checkouts.',
    inputSchema: { type: 'object', properties: {} },
  },
];

export { DIRECTORY_PROPERTY };
export default lifecycleTools;
