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

import { z } from 'zod';

// The dev MCP tool contract - names, descriptions, input schemas and the
// server instructions - kept apart from the handlers so it can be read without
// a running dev server. The `lowdefy mcp` stdio shim lists these at session
// start, before any dev server exists, and forwards calls to the right one.
// This module must stay free of imports that touch build artifacts.

const INSTRUCTIONS = `Lowdefy documentation and feedback server for this project. Lowdefy apps are YAML config composing blocks (UI), operators (logic), actions (event handlers), and connections/requests (data).

Discovery workflow: start with lowdefy_overview. Use lowdefy_list_types with a kind to discover ALL installed blocks/operators/actions/connections/requests — never guess type names. Then lowdefy_get_schema and lowdefy_get_examples for the exact contract of a type, and lowdefy_get_doc / lowdefy_search_docs for concept documentation. lowdefy_list_plugins and lowdefy_get_plugin_doc cover this project's local plugin packages.

Push events: build results, server restarts and browser/server errors arrive as notifications/message from logger "lowdefy" (data.type is one of build, restart, client_error, server_error; a build event carries status, errors, warnings and stale). Act on them without polling — lowdefy_build_status remains the full picture.

Feedback loop: after EVERY config edit, call lowdefy_build_status with wait: true — the dev server rebuilds on file change, wait: true answers once your edit has been processed, and this returns the current build errors/warnings (with source file locations), recent browser runtime errors, and recent server errors (request, endpoint, MCP and agent failures with their config source). Fix what it reports, then confirm the page builds with lowdefy_get_page_config, and visually verify with lowdefy_screenshot_page. Use lowdefy_find_config to locate where any id (page, block, request) is defined. lowdefy_scaffold_page creates a canonical new page file. Use lowdefy_app_map first to understand an existing app. If a tool result begins with "STALE:", the last build FAILED and the answer comes from the previous successful build, not from your latest edits — call lowdefy_build_status and fix the reported errors before trusting anything else.

Live state: lowdefy_inspect_state reads the ACTUAL state, request results, and event log of a running page — when the developer has the page open in their browser it reads THEIR live tab (ask them to interact, then inspect), otherwise it runs the page headless. lowdefy_eval_operator evaluates any operator expression against that live state — use it to debug _state/_request bindings. lowdefy_run_request executes a request with a test payload to verify data shape (read-only unless the app opts into writes). lowdefy_run_endpoint runs an Api endpoint routine headlessly with a test payload (always needs cli.agentTools.allowWriteRequests, since routines are not classified read-only); a :reject comes back as status "reject" with the routine's own error, not as a tool failure. Pass system: true to run a scheduled or detached-only InternalApi routine as a system context (no _user, auth not checked), exactly as cron would.

Behaviour, not just layout: a screenshot shows what rendered, not what works. To verify behaviour, drive the page with lowdefy_run_journey — a declarative list of steps (click, fill, select, press, back, wait, screenshot, expect) addressed by blockId — and assert on state, visibility, text, url or title. A failing step stops the journey and comes back as data (passed: false, failure with expected/actual, the remaining steps skipped) together with the final page state, so you can read what the app actually did and write the next assertion. A large final state comes back as a summary of its keys; pass state with the paths you need. Pass user to act as a real member (e.g. {"roles":["admin"]}) when the flow is role-gated.

Role-gated pages: the headless renderer signs in as a roleless user, so a page or request gated on a role renders empty or refused. Pass user to lowdefy_screenshot_page, lowdefy_run_journey, lowdefy_inspect_state, lowdefy_eval_operator, lowdefy_load_state, lowdefy_run_request or lowdefy_run_endpoint to act as a specific caller — e.g. user {"roles":["admin"]} — and vary it per call to compare what different roles see. A request run without user runs as a roleless anonymous caller, so a tenant-walled or role-gated request returns empty rather than an error.

Safety: lowdefy_checkpoint snapshots the config files before risky multi-file changes; lowdefy_revert_checkpoint restores them.

Visual feedback: developers can press Cmd/Ctrl+/ in the running app to point at elements, draw, and copy annotated feedback to their clipboard, then paste it to you. Pasted annotation blocks start with "Feedback:" and carry the blockId, the resolved config file:line, drawn shapes, and usually an "Annotated screenshot:" file path — READ that image to see exactly what the developer drew. Treat them as precise UI feedback and use lowdefy_inspect_state for the page's live state.

State checkpoints (testing): lowdefy_snapshot_state captures a page's live state AND its request/api responses into .lowdefy/state-checkpoints/<name>/ (one file per part; gitignored — checkpoints contain user/session data). lowdefy_load_state puts the app back into that state: headless for your own verification, or registry-only which returns a ?_checkpoint URL the developer can open to manually test the app in that exact state (recorded request data is served automatically). lowdefy_checkpoint_to_mocks converts a checkpoint into e2e mocks.yaml fixtures — use it when asked to write e2e tests.`;

const HAZARDS_NOTE =
  ' Results include `hazards`: behaviours of this type that its schema does not show. Read them before writing config.';

// Shared by every tool that renders a page headless, so one call can act as an
// admin and the next as a plain member — each headless call gets its own browser
// context, so they never share an identity.
const userSchema = z
  .object({})
  .passthrough()
  .optional()
  .describe(
    'Act as this caller instead of the default roleless headless user, e.g. {"roles":["user-admin"]} to render a role-gated page. Merged over the default, so include email/profile/attributes fields too if the page reads them — no auth engine runs for an injected caller, so nothing derives them. Headless only: it is never applied to a page the developer opens in their own browser, so combining it with source "tab" or load_state mode "registry-only" is an error rather than a silently dropped role, and on lowdefy_run_request / lowdefy_run_endpoint it sets the caller the request or routine runs as.'
  );

const devToolDefinitions = {
  lowdefy_inspect_state: {
    description:
      "Read the LIVE state of a running page: state, request results, event log (recent actions fired), global, user, input, and urlQuery. If the developer has the page open in a browser it reads their actual tab (ask them to interact first, then inspect); otherwise it runs the page headless. Use this to see what the app's data model really looks like.",
    inputSchema: {
      pageId: z.string().describe('The page id to inspect.'),
      source: z
        .enum(['tab', 'headless'])
        .optional()
        .describe('Force a source. Default: live tab if connected, else headless.'),
      user: userSchema,
    },
  },

  lowdefy_eval_operator: {
    description:
      'Evaluate a Lowdefy operator expression against the live state of a running page — a REPL for config. Pass the operator object in the "expression" argument — any JSON value, e.g. {"_state": "customer.name"} or {"_if": {...}}. Evaluates in the real browser runtime (live tab if connected, else headless).',
    inputSchema: {
      pageId: z.string().describe('The page id whose context to evaluate against.'),
      expression: z
        .any()
        .describe('The operator expression — any JSON value, e.g. {"_state": "key"}.'),
      source: z.enum(['tab', 'headless']).optional(),
      user: userSchema,
    },
  },

  lowdefy_run_request: {
    description:
      'Execute a request in dev with a test payload to verify the data shape a page receives. Read-only request types always run; write requests are refused unless the app opts in (cli.agentTools.allowWriteRequests in lowdefy.yaml).',
    inputSchema: {
      pageId: z.string().describe('The page the request is defined on.'),
      requestId: z.string().describe('The request id.'),
      payload: z.record(z.any()).optional().describe('Test payload for _payload operators.'),
      user: userSchema,
    },
  },

  lowdefy_run_endpoint: {
    description:
      'Execute an Api endpoint routine in dev with a test payload and caller, to verify what it returns, rejects or throws. Requires agent write access (cli.agentTools.allowWriteRequests) because routines are not classified read-only. A :reject or :throw comes back as data (success: false, status "reject"/"error" with the routine\'s own error), not as a tool failure. Pass system: true to run it as a system context the way a cron or detached run does — no user (_user undefined), endpoint auth not checked, InternalApi endpoints allowed — which is the local test path for scheduled (schedules) and detached-only routines. Nested CallApi steps with detached: true still dispatch over HTTP and need CRON_SECRET set on the dev server; they are not faked.',
    inputSchema: {
      endpointId: z.string().describe('The Api endpoint id.'),
      payload: z.record(z.any()).optional().describe('Test payload for _payload operators.'),
      user: userSchema,
      system: z
        .boolean()
        .optional()
        .describe(
          'Run as a system context (like /api/cron and /api/detached): no user, auth not checked, InternalApi allowed. Cannot be combined with user.'
        ),
    },
  },

  lowdefy_restart: {
    description:
      "Restart the dev server process. Use after editing a local plugin's server-side implementation, or when build_status looks stale. The connection drops: wait about two seconds, then call lowdefy_build_status before continuing.",
    inputSchema: {
      reason: z.string().optional().describe('Why the restart is needed (logged by the manager).'),
    },
  },

  lowdefy_app_map: {
    description:
      'The whole-app graph in one call: every page (with its source file and, when built, block/request summaries), menus, connections, api endpoints, agents, and websockets. Call this first when working in an existing app.',
    inputSchema: {},
  },

  lowdefy_snapshot_state: {
    description:
      "Capture the live state AND recorded request/api responses of a running page into a checkpoint folder (.lowdefy/state-checkpoints/<name>/, one file per part; gitignored — checkpoints contain user/session data). Snapshot the developer's open tab after they reproduce a scenario, or a headless run. Use for building test fixtures and reproducible app states.",
    inputSchema: {
      pageId: z.string().describe('The page to snapshot.'),
      name: z.string().describe('Checkpoint name (letters, numbers, - and _).'),
      notes: z.string().optional().describe('What this checkpoint captures.'),
      source: z.enum(['tab', 'headless']).optional(),
      overwrite: z.boolean().optional(),
    },
  },

  lowdefy_load_state: {
    description:
      "Put the app back into a saved state checkpoint. mode 'headless' (default) verifies the restored state itself; mode 'registry-only' loads the recorded request data into the dev server and returns a ?_checkpoint URL the developer can open to manually test the app in that exact state.",
    inputSchema: {
      name: z.string().describe('The checkpoint name.'),
      mode: z.enum(['headless', 'registry-only']).optional(),
      user: userSchema,
    },
  },

  lowdefy_list_state_checkpoints: {
    description: 'List saved state checkpoints (name, page, captured time, notes).',
    inputSchema: {},
  },

  lowdefy_checkpoint_to_mocks: {
    description:
      'Convert a state checkpoint into @lowdefy/e2e-utils mocks.yaml fixtures (requests/api entries plus rendered yaml). Use when writing e2e tests from a captured scenario.',
    inputSchema: {
      name: z.string().describe('The checkpoint name.'),
    },
  },

  lowdefy_checkpoint: {
    description:
      'Snapshot all config files before risky changes. Returns a checkpoint id for lowdefy_revert_checkpoint. Use before multi-file edits so you can restore instantly.',
    inputSchema: {
      label: z.string().describe('Short label for the checkpoint, e.g. "before-refactor".'),
    },
  },

  lowdefy_revert_checkpoint: {
    description:
      'Restore config files from a checkpoint made with lowdefy_checkpoint (restores changed files and removes files added since). Omit id to list available checkpoints.',
    inputSchema: {
      id: z.string().optional().describe('Checkpoint id. Omit to list checkpoints.'),
    },
  },

  lowdefy_build_status: {
    description:
      'Call after every config edit. Returns the current build status: errors and warnings from the last build (with source file locations), recent browser runtime errors, and recent server errors — request, endpoint, MCP and agent tool failures with their config source. The dev server rebuilds automatically on file change — edit, then call this with wait: true to see what broke.',
    inputSchema: {
      wait: z
        .boolean()
        .optional()
        .describe(
          'Wait until the dev server has processed your latest edits (the rebuild or page invalidation they trigger) before answering, instead of returning the status of the build before them. Use it right after an edit. Waits up to a minute; `settled: false` in the result means it gave up.'
        ),
    },
  },

  lowdefy_check: {
    description:
      'Validate the whole app the way a production build (`lowdefy build`) would, without building it: every page, including ones not yet opened in dev, and the prod-only checks `lowdefy dev` reports only as warnings (they come back here as errors with prodError: true). Returns ok plus located errors and warnings (source file:line). Takes a few seconds. Call before telling the developer a change is done.',
    inputSchema: {},
  },

  lowdefy_get_page_config: {
    description:
      'Get the fully built config for a page, or its structured build errors if the page fails to build. Use to verify a page after editing it.',
    inputSchema: {
      pageId: z.string().describe('The page id.'),
    },
  },

  lowdefy_find_config: {
    description:
      'Find where a config entity is defined: pass a page, block, or request id and get the source yaml file (and line where available). For block/request ids also pass the owning pageId so the page is built first.' +
      HAZARDS_NOTE,
    inputSchema: {
      id: z.string().describe('The id to find, e.g. a pageId, blockId, or requestId.'),
      pageId: z
        .string()
        .optional()
        .describe(
          'The page the id belongs to — required for block/request ids on pages not yet built.'
        ),
    },
  },

  lowdefy_screenshot_page: {
    description:
      'Screenshot a page of the running dev server (headless Chromium) to visually verify layout and rendering. Returns a PNG image. Set width (and height) to check a narrow or phone layout, e.g. width 390, and colorScheme "dark" to check dark mode.',
    inputSchema: {
      pageId: z.string().describe('The page id to screenshot.'),
      fullPage: z.boolean().optional().describe('Capture the full scrollable page.'),
      clip: z
        .object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        })
        .optional()
        .describe(
          "Crop to a viewport-relative region — pass an annotation's geometry from feedback."
        ),
      scrollX: z.number().optional().describe('Scroll offset the clip was recorded at.'),
      scrollY: z.number().optional().describe('Scroll offset the clip was recorded at.'),
      width: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Viewport width in CSS pixels. Default 1280; 390 is a phone.'),
      height: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Viewport height in CSS pixels. Default 800.'),
      colorScheme: z
        .enum(['light', 'dark'])
        .optional()
        .describe(
          'The colour scheme the page\'s prefers-color-scheme reports. Default "light". An app that follows the system theme renders dark with "dark"; a darkMode fixed in the app config wins.'
        ),
      user: userSchema,
    },
  },

  lowdefy_run_journey: {
    description:
      'Drive a page of the running dev server headless through declarative steps and assert what happens — the way to verify behaviour (a form submits, a modal opens, a filter works), not just layout. Blocks are addressed by blockId; a target object narrows to a grid row/cell ({"blockId": "grid", "row": 1, "column": "actions"}), to the control with exactly some text ({"blockId": "grid", "row": 1, "text": "Edit"}), or reaches portal-rendered controls page-wide by text alone ({"text": "OK"} for a confirm dialog or modal footer button, a menu item). A step that fails stops the journey and is returned as data (passed: false, failure with index/step/expected/actual/message, later steps "skipped") — never as a tool error. Returns the final page state (whole when small, otherwise stateOmitted with its size and top-level keys; see the state param) and any screenshots taken (as images after the JSON text).',
    inputSchema: {
      pageId: z.string().describe('The page id to open.'),
      steps: z
        .array(z.record(z.any()))
        .describe(
          'Ordered steps, one key each: {"click": target} | {"fill": {...target, "value"}} | {"select": {...target, "value"}} (option by exact text: a dropdown option, or a radio, button or segmented option in the block) | {"press": "Enter" | "Mod+k"} (Mod is Meta/Control per platform) | {"back": true} (the browser Back button) | {"wait": {"ms": n} | {"request": requestId} | {"state": path}} | {"screenshot": name?} | {"expect": {"state": {"path", "equals"}} | {"visible": target} | {"text": {...target, "contains"}} | {"url": {"contains"}} | {"title": {"equals"} | {"contains"}}} (title is the document title). A target is a blockId string, or an object of {"blockId", "row" (zero-based grid row as displayed), "column" (grid col-id), "text" (exact text of the interactive control to use), "nth" (zero-based pick among several matches)}; "text" without "blockId" searches the whole page, which is how confirm dialog / modal footer buttons and dropdown menu items are reached. fill, select and expect.text need a blockId. Each step gets 5s; after an interaction the runner waits for the page\'s pending events and requests to settle.'
        ),
      user: userSchema,
      urlQuery: z
        .record(z.any())
        .optional()
        .describe('Query params to open the page with, read by _url_query, e.g. {"id": "1"}.'),
      state: z
        .union([z.boolean(), z.array(z.string().min(1))])
        .optional()
        .describe(
          'What the result carries of the final page state. Omitted: the whole state when it is at most 10000 characters of JSON, otherwise stateOmitted (its size and each top-level key with its size). An array of state paths, e.g. ["form.name", "rows"]: state is {path: value} for each, null where undefined. true: the whole state, however large. false: no state.'
        ),
    },
  },

  lowdefy_scaffold_page: {
    description:
      'Create a new page yaml file with a canonical minimal structure. Refuses if the page already exists. Returns the created file path and the lowdefy.yaml registration step you must do next.',
    inputSchema: {
      pageId: z.string().describe('The new page id (letters, numbers, - and _).'),
      title: z.string().optional().describe('Page title. Defaults to the pageId.'),
    },
  },

  lowdefy_overview: {
    description:
      'Start here. Overview of everything this Lowdefy project has available: counts of blocks/operators/actions/connections/requests, installed plugins, doc sections, and which tool to use next.',
    inputSchema: {},
  },

  lowdefy_list_types: {
    description:
      'List ALL available types of a kind — every block, operator, action, connection, or request type installed in this project (core and local plugins), whether used yet or not. Call this before writing any config to get exact type names.',
    inputSchema: {
      kind: z
        .enum([
          'blocks',
          'operators',
          'actions',
          'connections',
          'requests',
          'agents',
          'notifications',
          'websockets',
        ])
        .describe('The kind of types to list.'),
    },
  },

  lowdefy_list_plugins: {
    description:
      "List installed plugin packages (including this project's local custom plugins) and the type names each provides.",
    inputSchema: {},
  },

  lowdefy_get_schema: {
    description:
      'Get the JSON Schema for a specific type: all properties, events, and their descriptions. Use the exact type name from lowdefy_list_types.' +
      HAZARDS_NOTE,
    inputSchema: {
      kind: z
        .enum(['blocks', 'operators', 'actions', 'connections', 'requests'])
        .describe('The kind of the type.'),
      type: z.string().describe('The exact type name, e.g. "Button", "_get", "MongoDBFind".'),
    },
  },

  lowdefy_get_examples: {
    description:
      'Get real YAML usage examples for a block type (gallery and example configs shipped with the plugin).',
    inputSchema: {
      type: z.string().describe('The exact block type name, e.g. "Button".'),
    },
  },

  lowdefy_get_doc: {
    description:
      'Get a core Lowdefy documentation page as markdown. Look up by slug (e.g. "concepts/lowdefy-schema", "operators/_get") or by kind + type name. Key concept slugs: concepts/lowdefy-schema, concepts/blocks, concepts/events-and-actions, concepts/connections-and-requests, concepts/operators, concepts/page-and-app-state.' +
      HAZARDS_NOTE,
    inputSchema: {
      slug: z.string().optional().describe('Doc slug, e.g. "operators/_get".'),
      kind: z
        .enum(['block', 'operator', 'action', 'connection'])
        .optional()
        .describe('Kind of the type to find the doc for.'),
      type: z.string().optional().describe('Type name to find the doc for, e.g. "_get".'),
    },
  },

  lowdefy_search_docs: {
    description: 'Search the core Lowdefy docs by keyword. Returns matching slugs with snippets.',
    inputSchema: {
      query: z.string().describe('Search keywords.'),
    },
  },

  lowdefy_get_plugin_doc: {
    description:
      "Get markdown documentation shipped inside an installed plugin package (README, guides). Useful for this project's local custom plugins.",
    inputSchema: {
      package: z.string().describe('The package name, e.g. "@lowdefy/blocks-antd".'),
    },
  },
};

export { HAZARDS_NOTE, INSTRUCTIONS };
export default devToolDefinitions;
