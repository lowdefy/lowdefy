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

import docSources from './docSources.js';
import { MAX_JOURNEY_TIMEOUT } from './validateJourneyTimeout.js';
import { MAX_VIEWPORT_SIZE } from './validateViewport.js';

// The dev MCP tool contract - names, descriptions, input schemas and the
// server instructions - kept apart from the handlers so it can be read without
// a running dev server. The `lowdefy mcp` stdio shim lists these at session
// start, before any dev server exists, and forwards calls to the right one.
// This module must stay free of imports that touch build artifacts.

// The server instructions every session pays for. They hold only what applies
// across tools - the edit loop, the stale warning and how to act as someone -
// and leave each tool's detail to its description and get_doc.
const INSTRUCTIONS = `Lowdefy dev server for this project: docs for every installed type, and the feedback loop for config edits. Lowdefy apps are YAML config composing blocks (UI), operators (logic), actions (event handlers), and connections/requests (data).

Never guess a type name: lowdefy_list_types lists every installed type, lowdefy_get_schema gives its exact contract, and lowdefy_get_examples, lowdefy_get_doc and lowdefy_search_docs the docs, the app's own plugin and module docs included. lowdefy_app_map maps an existing app.

After EVERY config edit, call lowdefy_build_status with wait: true. It answers once the edit is processed and the pages it touched are built, with the build status, located errors and recent browser and server errors. Fix what it reports, then check the page with lowdefy_get_page_config and lowdefy_screenshot_page, and verify its behaviour with lowdefy_run_journey. Call lowdefy_check before saying a change is done.

If a tool result begins with "STALE:", the last build FAILED and the answer comes from the previous successful build, not from your latest edits: call lowdefy_build_status and fix the reported errors before trusting anything else.

Build results, restarts and browser and server errors also arrive as notifications/message from logger "lowdefy". lowdefy_build_status stays the full picture, and the only one that reports pages that fail to build.

Acting as someone: the headless renderer signs in as a roleless user, so a role-gated page or request renders empty or refused. Every tool that takes user takes it in the same forms: a user object such as {"roles":["admin"]}, merged over the default user (add the email or profile fields the page reads, since no auth engine derives them); "none" to act signed out, so the app's own auth decides; or the name of a user in the data set that data names (tests/data/<name>.yaml), which also runs the call on that data set's own in-memory database. user and data are headless only, so combining them with source "tab" is an error. A request run without user runs as a roleless anonymous caller, so a tenant-walled request returns empty rather than an error.

Phones: mobile pages run in Lowdefy Dev on a phone, simulator or emulator, which joins this server as a tab. lowdefy_device lists them (action "list"), starts one ("start") and fakes a device result ("inject"); pass its tab id as device to lowdefy_screenshot_page, lowdefy_run_journey or lowdefy_inspect_state to act on the phone.`;

const HAZARDS_NOTE =
  ' Results include `hazards`: behaviours of this type that its schema does not show. Read them before writing config.';

// The forms of user and data are written once, in INSTRUCTIONS; each tool that
// takes them points there.
const CALLER_NOTE =
  ' Pass user (and data) to act as someone, in the forms the server instructions give.';

// Shared by every tool that acts as someone. Each headless call gets its own
// browser context, so one call can act as an admin and the next as a member.
const userSchema = z
  .union([z.literal('none'), z.string().min(1), z.object({}).passthrough()])
  .optional()
  .describe(
    'Who the call acts as: a user object, "none", or the name of a data set user. Omitted: the default roleless user.'
  );

// Shared by every tool that takes userSchema.
const dataSchema = z
  .string()
  .optional()
  .describe('A data set in tests/data/<name>.yaml, run on its own in-memory database.');

// Shared by every tool that names a page instance: a page whose `path` has
// placeholders has one instance per set of values.
const pathParamsSchema = z
  .record(z.union([z.string(), z.number()]))
  .optional()
  .describe(
    'Values for the placeholders of a page whose path has them, read by _path_params, e.g. {"space": "support", "ticket_id": "1234"} for path "tickets/{space}/{ticket_id}" (lowdefy_app_map shows each page\'s path). Required to open such a page headless; a missing placeholder is an error naming it.'
  );

// Shared by every tool that can act on a phone instead of the headless browser.
const deviceSchema = z
  .string()
  .optional()
  .describe(
    'A phone to act on instead of the headless browser: its tab id from lowdefy_device with action "list". The phone runs the app in Lowdefy Dev (a simulator, an emulator or a real phone) and is used as it is: on the page it shows, with its own signed-in user and the app\'s real database, so user and data do not apply.'
  );

// Shared by the request and endpoint runners.
const saveResponseSchema = z
  .boolean()
  .optional()
  .describe(
    'Write the full response to a JSON file under .lowdefy/responses/ in the app directory and return its path (responseFile) instead of the response. A response too large to return inline is always written there.'
  );

const devToolDefinitions = {
  lowdefy_inspect_state: {
    description:
      "Read the LIVE state of a running page: state, request results, event log (recent actions fired), global, user, input, and urlQuery. If the developer has the page open in a browser it reads their actual tab (ask them to interact first, then inspect); otherwise it runs the page headless. Use this to see what the app's data model really looks like. Pass expression to evaluate an operator expression against that live state instead, a REPL for config: the result is { value, errors, source, reads } with no snapshot, reads naming the state, request and other paths it read." +
      CALLER_NOTE,
    inputSchema: {
      pageId: z.string().describe('The page id to inspect.'),
      pathParams: pathParamsSchema.describe(
        'The page instance to inspect, for a page whose path has placeholders, e.g. {"ticket_id": "1"}. Without it a live tab is read at the instance it shows (or that page\'s most recently shown one); headless needs it to open the page.'
      ),
      expression: z
        .any()
        .optional()
        .describe(
          'An operator expression to evaluate in the real browser runtime instead of returning the snapshot — any JSON value, e.g. {"_state": "customer.name"} or {"_if": {...}}. null is evaluated too.'
        ),
      source: z
        .enum(['tab', 'headless'])
        .optional()
        .describe(
          "Force a source. Default: live tab if connected, else headless. With device, the phone's tab."
        ),
      device: deviceSchema.describe(
        "Read a phone's live state: its tab id from lowdefy_device list. The phone must show, or have shown, the page. Never falls back to headless."
      ),
      user: userSchema,
      data: dataSchema,
    },
  },

  lowdefy_run_request: {
    description:
      'Execute a request in dev with a test payload to verify the data shape a page receives. The page is built first when it changed since its last build, so the request that runs is the one in the config now; a page that fails to build is refused with its build errors. Read-only request types always run; write requests are refused unless the app opts in (cli.agentTools.allowWriteRequests in lowdefy.yaml). A response too large to return inline is written in full to responseFile.' +
      CALLER_NOTE,
    inputSchema: {
      pageId: z.string().describe('The page the request is defined on.'),
      requestId: z.string().describe('The request id.'),
      payload: z.record(z.any()).optional().describe('Test payload for _payload operators.'),
      user: userSchema,
      data: dataSchema,
      saveResponse: saveResponseSchema,
    },
  },

  lowdefy_run_endpoint: {
    description:
      'Execute an Api endpoint routine in dev with a test payload and caller, to verify what it returns, rejects or throws. Needs cli.agentTools.allowWriteRequests, since routines are not classified read-only. A :reject or :throw comes back as data (success: false, status "reject" or "error" with the routine\'s own error). Pass system: true to run it as a cron or detached run does: no user, auth not checked, InternalApi allowed. Nested CallApi steps with detached: true still dispatch over HTTP and need CRON_SECRET on the dev server.' +
      CALLER_NOTE,
    inputSchema: {
      endpointId: z.string().describe('The Api endpoint id.'),
      payload: z.record(z.any()).optional().describe('Test payload for _payload operators.'),
      user: userSchema,
      data: dataSchema,
      system: z
        .boolean()
        .optional()
        .describe(
          'Run as a system context (like /api/cron and /api/detached): no user, auth not checked, InternalApi allowed. Cannot be combined with user.'
        ),
      saveResponse: saveResponseSchema,
    },
  },

  lowdefy_restart: {
    description:
      'Restart the dev server process. Use when the server seems stuck or build_status looks stale, or after secrets a wrapper (for example infisical) injects have changed; .env edits and local plugin code are picked up without a restart. The connection drops: call lowdefy_build_status with wait: true, which answers once the restarted server is ready.',
    inputSchema: {
      reason: z.string().optional().describe('Why the restart is needed (logged by the manager).'),
    },
  },

  lowdefy_app_map: {
    description:
      'The whole-app graph in one call: every page (with its source file and, when built, block/request summaries), menus, connections, api endpoints, agents, and websockets. Call this first when working in an existing app.',
    inputSchema: {},
  },

  lowdefy_build_status: {
    description:
      'Call after every config edit, with wait: true. build.status is ok when the config builds and no page failed its latest build, pages_failed (build.failedPages names them) when a page failed and has not changed since, and error when the config build fails. Then the located errors and warnings of the config build and of each failed page, pages changed since they were built, and recent browser, phone (surface "mobile") and server errors. Errors from before your latest edit come apart under earlierErrors.',
    inputSchema: {
      wait: z
        .boolean()
        .optional()
        .describe(
          'Wait until the dev server has processed your latest edits (the rebuild or page invalidation they trigger, and any server restart or plugin install the rebuild needs), then build every page they touched, before answering, instead of returning the status of the build before them. pages.checked lists the pages it built. Use it right after an edit. Waits up to two minutes; `settled: false` in the result means it gave up.'
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
      "Get the fully built config for a page as { page }, or its structured build errors if the page fails to build. Use to verify a page after editing it. Pass blockId for one block's subtree as { block }. A result over 40,000 characters is written in full to a file under .lowdefy/responses/, and its path comes back instead.",
    inputSchema: {
      pageId: z.string().describe('The page id.'),
      blockId: z.string().optional().describe('Return only this block and the blocks inside it.'),
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
      'Screenshot a page of the running dev server (headless Chromium) to verify layout and rendering. Returns a PNG. Set width (e.g. 390 for a phone) and colorScheme "dark" to check those layouts. Pass steps to capture a state beyond the loaded page, such as an open dropdown or a modal; portal popups are included. Pass urlQuery for a page that reads _url_query, and pathParams for a page whose path has placeholders. Pass device (a tab id from lowdefy_device list) to capture a phone in Lowdefy Dev instead; its steps run on the phone (no open).' +
      CALLER_NOTE,
    inputSchema: {
      pageId: z
        .string()
        .describe(
          'The page id to screenshot. With device, the page the phone must show; a phone is not navigated.'
        ),
      pathParams: pathParamsSchema,
      urlQuery: z
        .record(z.any())
        .optional()
        .describe(
          'Query params to open the page with, read by _url_query, e.g. {"framework": "popia"}.'
        ),
      steps: z
        .array(z.record(z.any()))
        .optional()
        .describe(
          'Steps run in order after the page settles and before the capture, the same steps as lowdefy_run_journey (lowdefy_get_schema kind "journey-step" gives the grammar), e.g. [{"open": "status"}] to capture an open dropdown or [{"click": "add"}] for a modal. A {"screenshot": name} step captures an earlier state too. If a step fails the screenshot still returns, showing where it stopped.'
        ),
      fullPage: z.boolean().optional().describe('Capture the full scrollable page.'),
      clip: z
        .object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        })
        .optional()
        .describe('Crop to a viewport-relative region.'),
      scrollX: z.number().optional().describe('Scroll offset the clip was recorded at.'),
      scrollY: z.number().optional().describe('Scroll offset the clip was recorded at.'),
      width: z
        .number()
        .int()
        .positive()
        .max(MAX_VIEWPORT_SIZE)
        .optional()
        .describe(
          `Viewport width in CSS pixels, at most ${MAX_VIEWPORT_SIZE}. Default 1280; 390 is a phone.`
        ),
      height: z
        .number()
        .int()
        .positive()
        .max(MAX_VIEWPORT_SIZE)
        .optional()
        .describe(
          `Viewport height in CSS pixels, at most ${MAX_VIEWPORT_SIZE}. Default 800. Use fullPage for a long page.`
        ),
      colorScheme: z
        .enum(['light', 'dark'])
        .optional()
        .describe(
          'The colour scheme the page\'s prefers-color-scheme reports. Default "light". An app that follows the system theme renders dark with "dark"; a darkMode fixed in the app config wins.'
        ),
      device: deviceSchema.describe(
        'Capture a phone instead of the headless browser: its tab id from lowdefy_device list. urlQuery, fullPage, clip, scrollX, scrollY, width, height, colorScheme, user and data apply to the headless browser only.'
      ),
      user: userSchema,
      data: dataSchema,
    },
  },

  lowdefy_run_journey: {
    description:
      'Drive a page of the running dev server headless through declarative steps and assert what happens - the way to verify behaviour (a form submits, a modal opens, a filter works), not just layout. A step that fails stops the journey and comes back as data (passed: false, failure with index, step, expected, actual and message, later steps skipped), never as a tool error. A journey also fails at the step that raises an app error (an action error that is not a user error, an uncaught page error, a server error or 5xx): failure.kind "app-error" with errors [{kind, message, source, configKey}]. A failed Validate, a Throw action and 401/403 refusals never count; {"expect": {"error": text}} straight after an interaction claims an intended error. Returns the final page state (see state) and any screenshots, as images after the JSON.' +
      CALLER_NOTE,
    inputSchema: {
      pageId: z.string().describe('The page id to open.'),
      steps: z
        .array(z.record(z.any()))
        .describe(
          'Ordered steps, one key each: click, open, fill, select, press, back, goto, email, as, wait, screenshot, expect. lowdefy_get_schema with kind "journey-step" returns the grammar of every step with examples, or of one with type, e.g. "expect". A target is a blockId or {"blockId", "row", "column", "text", "containing", "nth"}; "text" alone reaches dialog, menu and email buttons. Every id a step names is checked against the build before it runs. With device, a phone runs click, fill, select, press, wait, screenshot and expect state, each by blockId; any other step is refused.'
        ),
      device: deviceSchema.describe(
        'Run the journey on a phone instead of the headless browser: its tab id from lowdefy_device list. It starts on the page the phone shows, which must be pageId; urlQuery, user, data and exercised do not apply.'
      ),
      user: z
        .union([
          z.literal('none'),
          z.string().min(1),
          z.object({}).passthrough(),
          z.array(z.string().min(1)).min(1),
        ])
        .optional()
        .describe(
          'Who the journey acts as, in the forms the server instructions give ("none" starts signed out, so sign-up and sign-in run for real), or a list of data set user names (needs data): the journey runs once as each and returns {passed, runs}.'
        ),
      data: z
        .string()
        .optional()
        .describe(
          'A data set in tests/data/<name>.yaml: the journey runs on a fresh in-memory MongoDB database loaded with it, so it may write freely, and user and "as" can name its users. Format: lowdefy_get_doc testing/journey-data-sets.'
        ),
      pathParams: z
        .record(z.string())
        .optional()
        .describe(
          'Values for the placeholders of the page\'s path, read by _path_params, e.g. {"space": "support", "ticket_id": "1"} for path "{space}/tickets/{ticket_id}".'
        ),
      urlQuery: z
        .record(z.any())
        .optional()
        .describe('Query params to open the page with, read by _url_query, e.g. {"id": "1"}.'),
      timeout: z
        .number()
        .int()
        .min(1)
        .max(MAX_JOURNEY_TIMEOUT)
        .optional()
        .describe(
          `How long each step may wait, in milliseconds (at most ${MAX_JOURNEY_TIMEOUT}). Default 5000. Raise it for a slow machine instead of adding wait ms steps; a step still moves on as soon as its condition holds. Page opens get at least 15000; the settle after an interaction stays at most 5000.`
        ),
      state: z
        .union([z.boolean(), z.array(z.string().min(1))])
        .optional()
        .describe(
          'What the result carries of the final page state. Omitted: the whole state when it is at most 10000 characters of JSON, otherwise stateOmitted (its size and each top-level key with its size). An array of state paths, e.g. ["form.name", "rows"]: state is {path: value} for each, null where undefined. true: the whole state, however large. false: no state.'
        ),
      exercised: z
        .boolean()
        .optional()
        .describe(
          "What the result carries of what the run exercised (every request, endpoint, event and rendered block it touched). Omitted: only a count of each. true: the full block, e.g. to check that a block rendered or which requests ran. false: leave it out. `lowdefy test` and the journey lints always read the full block; this only shapes this tool's response."
        ),
    },
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
      target: z
        .enum(['web', 'mobile'])
        .optional()
        .describe(
          'Which pages the types are for. Default "web": the types of the installed plugins. "mobile": the blocks, actions and client operators a native shell carries, for pages with target mobile; kinds that run on the server (connections, requests, server operators) are the same for both. Shell types carry no used flag.'
        ),
    },
  },

  lowdefy_get_schema: {
    description:
      'Get the JSON Schema for a specific type: all properties, events, and their descriptions. Use the exact type name from lowdefy_list_types.' +
      HAZARDS_NOTE,
    inputSchema: {
      kind: z
        .enum(['blocks', 'operators', 'actions', 'connections', 'requests', 'journey-step'])
        .describe(
          'The kind of the type. "journey-step" returns the lowdefy_run_journey step grammar, with examples of every step.'
        ),
      type: z
        .string()
        .optional()
        .describe(
          'The exact type name, e.g. "Button", "_get", "MongoDBFind". Required, except for kind "journey-step", where it names one step (e.g. "wait") and is omitted for every step.'
        ),
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
      'Get a Lowdefy documentation page as markdown. Look up by slug (e.g. "concepts/lowdefy-schema", "operators/_get") or by kind + type name. Also returns the docs this app\'s own plugins and modules ship: "plugins/<package>" and "modules/<id>" for a README, "plugins/<package>/<file>" and "modules/<id>/<file>" for a docs/*.md file, and "modules/<id>/manifest" for the components, exports and vars a module declares. Key concept slugs: concepts/lowdefy-schema, concepts/blocks, concepts/events-and-actions, concepts/connections-and-requests, concepts/operators, concepts/page-and-app-state.' +
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
    description:
      'Search the Lowdefy docs by keywords. The query is split into words, and pages are ranked by how many match, title matches first. Returns up to 20 hits, each with its slug, snippet, source, package and version; read one with lowdefy_get_doc.',
    inputSchema: {
      query: z.string().describe('Search keywords, e.g. "Link action pathParams".'),
      source: z
        .enum(docSources)
        .optional()
        .describe('Only search docs from this source. Default: all.'),
    },
  },

  lowdefy_search_icons: {
    description:
      'Search icon names before using one — never invent a name. Returns matching semantic names (edit, delete, warning, … and this app\'s theme.icons.aliases) with their targets, then Lucide names in PascalCase, then qualified names (set:Name) from installed icon set plugins. Use a semantic name when one fits, otherwise a Lucide name, in any icon property (icon: edit, icon: Receipt) or in HTML as <i data-icon="edit"></i>.',
    inputSchema: {
      query: z.string().describe('What the icon shows, e.g. "trash" or "arrow right".'),
      limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Max icon names (after semantic names). Default 30.'),
    },
  },

  lowdefy_device: {
    description:
      'Phones for the app\'s mobile pages, which run in Lowdefy Dev. action "list": the phones connected to this dev server, each with the tab id the other tools take as device, the page it shows and whether it is paired over the network; plus the booted iOS simulators and the Android devices on this computer. action "start" with platform "ios" or "android": boot a simulator or emulator (or use a booted one or a USB phone), install Lowdefy Dev from LOWDEFY_DEV_APP_IOS or LOWDEFY_DEV_APP_ANDROID and open it on this dev server, as `lowdefy dev --ios` or `--android` does; returns the new phone\'s device id once it joins. action "inject" with device and inject {kind, value, name}: fake the phone\'s next device result through Lowdefy Dev - kind "scan" {data}, "photo" {base64}, "nfc" (the tag read), "transcript" {partials, final} or {error} (what the next dictation session in a Composer or AgentChat hears), "location" {latitude, longitude} or a list of them as a route, "permission" with name and value "granted" or "denied", "network" "online" or "offline", "push" {title, body, data, categoryId?, open?, actionId?, text?} (shown by Lowdefy Dev; open taps it, actionId presses that button), or an APNs payload with aps (delivered by xcrun simctl push on an iOS simulator), "share" {text?, url?, files?} (as if shared into the app from another app), or "clear". On an iOS simulator a location and a permission are also set with xcrun simctl location and simctl privacy.',
    inputSchema: {
      action: z.enum(['list', 'start', 'inject']).describe('What to do.'),
      platform: z
        .enum(['ios', 'android'])
        .optional()
        .describe('For start: the iOS simulator or an Android emulator or USB phone.'),
      device: deviceSchema.describe('For inject: the phone, its tab id from action "list".'),
      inject: z
        .object({
          kind: z
            .enum([
              'scan',
              'photo',
              'nfc',
              'transcript',
              'location',
              'permission',
              'network',
              'push',
              'share',
              'clear',
            ])
            .describe('What to fake.'),
          value: z
            .any()
            .optional()
            .describe(
              'scan {"data": "ABC-123"}, photo {"base64": "..."}, nfc the tag read as an object, transcript {"partials": ["for Sam"], "final": "for Sam, can you look"} or {"error": "not-allowed"}, location {"latitude": -33.92, "longitude": 18.42} or a list of them, permission "granted" | "denied", network "online" | "offline", push {"title", "body", "data": {"path": "/tasks/7"}, "categoryId"?, "open": true?, "actionId"?, "text"?} (shown now; open taps it, actionId presses a button) or an APNs payload {"aps": {...}} delivered by simctl on an iOS simulator, share {"text"?, "url"?, "files"?: [{"uri", "name", "mimeType"}]} (as if shared into the app).'
            ),
          name: z
            .string()
            .optional()
            .describe('For permission: the permission, e.g. "location", "camera" or "microphone".'),
        })
        .optional()
        .describe('For inject: the device result to fake.'),
    },
  },

  lowdefy_journey_session: {
    description:
      'Read what the developer did in this app\'s dev server, to write journeys from. Without an id: the recorded dev sessions, newest first, one line each (id, time span, pages, interactions, failures). With an id: that session as a log, one line per interaction with what the app did in response, e.g. `click save → Validate failed [priority]`, `fill title "Quarterly"`, `click save → ran Validate, request createTicket ok`, and `page <pageId>` per page view. Failed attempts and their retries are both kept; values typed in dev and generated ids show as recorded. Write each journey from the log yourself (assert outcomes, not generated ids) and prove it with lowdefy_run_journey or `lowdefy test --repeat 3 <file>`.',
    inputSchema: {
      id: z.string().optional().describe('The session to read, as the list names it.'),
      since: z
        .string()
        .optional()
        .describe(
          'Only sessions with records at or after this time: a duration back from now (30m, 2h, 7d) or an ISO date.'
        ),
    },
  },
};

export { HAZARDS_NOTE, INSTRUCTIONS };
export default devToolDefinitions;
