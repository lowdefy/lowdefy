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
    "The app to act on: its directory or any path inside it, absolute or relative to the session's working directory. Defaults to the session's working directory. Pass your own working directory whenever you work in a different git worktree from the session (for example as a subagent), and the app's directory when the repository holds several apps. Apps in the session's checkout and the git worktrees of its repository are allowed; apps elsewhere need the user's approval, asked once (or `lowdefy hub trust`).",
};

const lifecycleTools = [
  {
    name: 'lowdefy_dev_start',
    description:
      "Start this app's dev server, or return it if it is already running, and wait until it is ready. Every other lowdefy_ tool starts the server on its own, so call this directly to restart it: restart: true when the server seems stuck or build status looks stale, or after secrets a wrapper (for example infisical) injects have changed - .env edits and local plugin code are picked up without a restart; clean: true also deletes the build directory first. Never run `lowdefy dev` yourself, and never pick a port.",
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
        lines: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          description: 'How many lines. Default 100, at most 1000.',
        },
        grep: {
          type: 'string',
          description: 'Only lines containing this text (case-insensitive).',
        },
      },
    },
  },
  {
    name: 'lowdefy_run_tests',
    description:
      'Run this app\'s tests (as `lowdefy test` does) against its dev server, starting it if needed. Choose all, a folder or glob, or a tag: no arguments runs every journey under tests/journeys/, sub-folders included, except folders starting with "_" (such as _candidates); `paths` runs journey files, folders or globs (`tests/journeys/review/**`); `tags` runs the journeys carrying any of the tags. `filter` narrows by name; paths, tags and filter combine. A journey whose `user` is a list of data set users runs once as each, named "<name> [<user>]" (filter "[admin]" picks one). `tier` then runs only the most-used journeys of that selection, by their production use: run tier "common" first for the happy paths, and widen to tier "edge" before calling a change done. Journeys marked `deprecated: true` are skipped. Returns a summary and one result per journey run: passed, or the failing step with expected and actual; each report line carries the journey\'s tier, rank, rate and failures. Add a journey (the steps you verified with lowdefy_run_journey) for behaviour you fixed.',
    inputSchema: {
      type: 'object',
      properties: {
        directory: DIRECTORY_PROPERTY,
        filter: {
          anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          description:
            'Only run journeys whose name contains this text, or any of these texts (case-insensitive).',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Only run journeys whose `tags` include any of these, e.g. ["smoke"]. Tags are lowercase letters, digits, "-" and "_".',
        },
        paths: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Journey files, folders (read with their sub-folders) or globs (*, ?, [...], **) to run instead of the whole suite, relative to the app directory and inside it (tests/journeys/_candidates/... included), e.g. ["tests/journeys/review/*.yaml"]. A glob that matches nothing is refused.',
        },
        repeat: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          description:
            'Run each journey this many times and classify it PASS, FLAKY or FAIL (each result carries `class`). A candidate is committed only after repeat: 3 gives PASS. Default 1.',
        },
        tier: {
          type: 'string',
          enum: ['common', 'wide', 'edge', 'full'],
          description:
            'Only run the journeys in this popularity tier of the selection, ranked by recent production use: common (the most-used journeys making up half of use, the happy paths), wide (80%), edge (95%, the edge cases real users still reach) or full (every journey, the default). Journeys with no counts for their current steps run in every tier. Refused when the selection has fewer than 100 production matches in the usage window.',
        },
        usageWindow: {
          type: 'string',
          pattern: '^[1-9][0-9]*m$',
          description:
            'The calendar months recent production use is ranked over, ending at the newest month any selected journey holds, e.g. "6m". Default "3m".',
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
