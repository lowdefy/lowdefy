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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import checkpointToMocks from './checkpointToMocks.js';
import createConfigCheckpoint from './createConfigCheckpoint.js';
import evalOperator from './evalOperator.js';
import findConfig from './findConfig.js';
import getAppMap from './getAppMap.js';
import getBuildStatus from './getBuildStatus.js';
import getCoreDoc from './getCoreDoc.js';
import getExamples from './getExamples.js';
import getOverview from './getOverview.js';
import getPageConfig from './getPageConfig.js';
import getPluginDoc from './getPluginDoc.js';
import getSchema from './getSchema.js';
import getStaleStatus from './getStaleStatus.js';
import inspectState from './inspectState.js';
import listConfigCheckpoints from './listConfigCheckpoints.js';
import listPlugins from './listPlugins.js';
import listTypes from './listTypes.js';
import loadState from './loadState.js';
import revertConfigCheckpoint from './revertConfigCheckpoint.js';
import requestRestart from './requestRestart.js';
import runEndpoint from './runEndpoint.js';
import runRequest from './runRequest.js';
import snapshotState from './snapshotState.js';
import { listStateCheckpoints } from './checkpointStore.js';
import createLogger from '../server/log/createLogger.js';
import scaffoldPage from './scaffoldPage.js';
import screenshotPage from './screenshotPage.js';
import searchDocs from './searchDocs.js';

const logger = createLogger({ server: 'lowdefy-dev-mcp' });

const INSTRUCTIONS = `Lowdefy documentation and feedback server for this project. Lowdefy apps are YAML config composing blocks (UI), operators (logic), actions (event handlers), and connections/requests (data).

Discovery workflow: start with lowdefy_overview. Use lowdefy_list_types with a kind to discover ALL installed blocks/operators/actions/connections/requests — never guess type names. Then lowdefy_get_schema and lowdefy_get_examples for the exact contract of a type, and lowdefy_get_doc / lowdefy_search_docs for concept documentation. lowdefy_list_plugins and lowdefy_get_plugin_doc cover this project's local plugin packages.

Feedback loop: after EVERY config edit, call lowdefy_build_status — the dev server rebuilds on file change and this returns the current build errors/warnings (with source file locations), recent browser runtime errors, and recent server errors (request, endpoint, MCP and agent failures with their config source). Fix what it reports, then confirm the page builds with lowdefy_get_page_config, and visually verify with lowdefy_screenshot_page. Use lowdefy_find_config to locate where any id (page, block, request) is defined. lowdefy_scaffold_page creates a canonical new page file. Use lowdefy_app_map first to understand an existing app. If a tool result begins with "STALE:", the last build FAILED and the answer comes from the previous successful build, not from your latest edits — call lowdefy_build_status and fix the reported errors before trusting anything else.

Live state: lowdefy_inspect_state reads the ACTUAL state, request results, and event log of a running page — when the developer has the page open in their browser it reads THEIR live tab (ask them to interact, then inspect), otherwise it runs the page headless. lowdefy_eval_operator evaluates any operator expression against that live state — use it to debug _state/_request bindings. lowdefy_run_request executes a request with a test payload to verify data shape (read-only unless the app opts into writes). lowdefy_run_endpoint runs an Api endpoint routine headlessly with a test payload (always needs cli.agentTools.allowWriteRequests, since routines are not classified read-only); a :reject comes back as status "reject" with the routine's own error, not as a tool failure.

Role-gated pages: the headless renderer signs in as a roleless user, so a page or request gated on a role renders empty or refused. Pass user to lowdefy_screenshot_page, lowdefy_inspect_state, lowdefy_eval_operator, lowdefy_load_state, lowdefy_run_request or lowdefy_run_endpoint to act as a specific caller — e.g. user {"roles":["admin"]} — and vary it per call to compare what different roles see. A request run without user runs as a roleless anonymous caller, so a tenant-walled or role-gated request returns empty rather than an error.

Safety: lowdefy_checkpoint snapshots the config files before risky multi-file changes; lowdefy_revert_checkpoint restores them.

Visual feedback: developers can press Cmd/Ctrl+/ in the running app to point at elements, draw, and copy annotated feedback to their clipboard, then paste it to you. Pasted annotation blocks start with "Feedback:" and carry the blockId, the resolved config file:line, drawn shapes, and usually an "Annotated screenshot:" file path — READ that image to see exactly what the developer drew. Treat them as precise UI feedback and use lowdefy_inspect_state for the page's live state.

State checkpoints (testing): lowdefy_snapshot_state captures a page's live state AND its request/api responses into .lowdefy/state-checkpoints/<name>/ (one file per part; gitignored — checkpoints contain user/session data). lowdefy_load_state puts the app back into that state: headless for your own verification, or registry-only which returns a ?_checkpoint URL the developer can open to manually test the app in that exact state (recorded request data is served automatically). lowdefy_checkpoint_to_mocks converts a checkpoint into e2e mocks.yaml fixtures — use it when asked to write e2e tests.`;

function textResult(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: 'text', text }] };
}

function notFoundResult(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

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

function createDocsMcpServer({ origin, honoContext } = {}) {
  const server = new McpServer(
    { name: 'lowdefy-docs', version: '1.0.0' },
    { instructions: INSTRUCTIONS }
  );

  // Debug-log every tool call (name + args, never the response) so agent
  // activity is visible in the dev terminal with --log-level=debug. Wrapping
  // registerTool here covers all tools without touching each registration.
  const registerTool = server.registerTool.bind(server);
  server.registerTool = (name, definition, handler) =>
    registerTool(name, definition, async (args, extra) => {
      try {
        logger.debug({ event: 'mcp_tool_call', tool: name, args }, `MCP tool call: ${name}`);
      } catch {
        // Logging must never break a tool call.
      }
      const result = await handler(args, extra);
      try {
        const stale = getStaleStatus();
        // Prepended rather than merged so it covers textResult, notFoundResult
        // and any future result shape without parsing the tool's own payload.
        if (stale && Array.isArray(result?.content)) {
          result.content.unshift({
            type: 'text',
            text: `STALE: ${stale.staleReason} ${JSON.stringify({
              stale: true,
              staleSince: stale.staleSince,
            })}`,
          });
        }
      } catch {
        // A missing or half-written artifact must never break a tool call.
      }
      return result;
    });

  server.registerTool(
    'lowdefy_inspect_state',
    {
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
    async ({ pageId, source, user }) => {
      const result = await inspectState({ origin, pageId, source, user });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return textResult(result);
    }
  );

  server.registerTool(
    'lowdefy_eval_operator',
    {
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
    async ({ pageId, expression, source, user }) => {
      const result = await evalOperator({ origin, pageId, expression, source, user });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return textResult(result);
    }
  );

  server.registerTool(
    'lowdefy_run_request',
    {
      description:
        'Execute a request in dev with a test payload to verify the data shape a page receives. Read-only request types always run; write requests are refused unless the app opts in (cli.agentTools.allowWriteRequests in lowdefy.yaml).',
      inputSchema: {
        pageId: z.string().describe('The page the request is defined on.'),
        requestId: z.string().describe('The request id.'),
        payload: z.record(z.any()).optional().describe('Test payload for _payload operators.'),
        user: userSchema,
      },
    },
    async ({ pageId, requestId, payload, user }) =>
      textResult(await runRequest({ pageId, requestId, payload, user, honoContext }))
  );

  server.registerTool(
    'lowdefy_run_endpoint',
    {
      description:
        'Execute an Api endpoint routine in dev with a test payload and caller, to verify what it returns, rejects or throws. Requires agent write access (cli.agentTools.allowWriteRequests) because routines are not classified read-only. A :reject or :throw comes back as data (success: false, status "reject"/"error" with the routine\'s own error), not as a tool failure.',
      inputSchema: {
        endpointId: z.string().describe('The Api endpoint id.'),
        payload: z.record(z.any()).optional().describe('Test payload for _payload operators.'),
        user: userSchema,
      },
    },
    async ({ endpointId, payload, user }) =>
      textResult(await runEndpoint({ endpointId, payload, user, honoContext }))
  );

  server.registerTool(
    'lowdefy_restart',
    {
      description:
        "Restart the dev server process. Use after editing a local plugin's server-side implementation, or when build_status looks stale. The connection drops: wait about two seconds, then call lowdefy_build_status before continuing.",
      inputSchema: {
        reason: z
          .string()
          .optional()
          .describe('Why the restart is needed (logged by the manager).'),
      },
    },
    ({ reason }) =>
      textResult({
        ...requestRestart({ reason }),
        note: 'The dev server is restarting. Wait ~2s, then poll GET /lowdefy-docs/build-status before your next call.',
      })
  );

  server.registerTool(
    'lowdefy_app_map',
    {
      description:
        'The whole-app graph in one call: every page (with its source file and, when built, block/request summaries), menus, connections, api endpoints, agents, and websockets. Call this first when working in an existing app.',
      inputSchema: {},
    },
    () => textResult(getAppMap())
  );

  server.registerTool(
    'lowdefy_snapshot_state',
    {
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
    async ({ pageId, name, notes, source, overwrite }) => {
      const result = await snapshotState({ origin, pageId, name, notes, source, overwrite });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return textResult(result);
    }
  );

  server.registerTool(
    'lowdefy_load_state',
    {
      description:
        "Put the app back into a saved state checkpoint. mode 'headless' (default) verifies the restored state itself; mode 'registry-only' loads the recorded request data into the dev server and returns a ?_checkpoint URL the developer can open to manually test the app in that exact state.",
      inputSchema: {
        name: z.string().describe('The checkpoint name.'),
        mode: z.enum(['headless', 'registry-only']).optional(),
        user: userSchema,
      },
    },
    async ({ name, mode, user }) => {
      const result = await loadState({ origin, name, mode, user });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return textResult(result);
    }
  );

  server.registerTool(
    'lowdefy_list_state_checkpoints',
    {
      description: 'List saved state checkpoints (name, page, captured time, notes).',
      inputSchema: {},
    },
    () => textResult(listStateCheckpoints())
  );

  server.registerTool(
    'lowdefy_checkpoint_to_mocks',
    {
      description:
        'Convert a state checkpoint into @lowdefy/e2e-utils mocks.yaml fixtures (requests/api entries plus rendered yaml). Use when writing e2e tests from a captured scenario.',
      inputSchema: {
        name: z.string().describe('The checkpoint name.'),
      },
    },
    ({ name }) => {
      const result = checkpointToMocks({ name });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return textResult(result);
    }
  );

  server.registerTool(
    'lowdefy_checkpoint',
    {
      description:
        'Snapshot all config files before risky changes. Returns a checkpoint id for lowdefy_revert_checkpoint. Use before multi-file edits so you can restore instantly.',
      inputSchema: {
        label: z.string().describe('Short label for the checkpoint, e.g. "before-refactor".'),
      },
    },
    ({ label }) => textResult(createConfigCheckpoint({ label }))
  );

  server.registerTool(
    'lowdefy_revert_checkpoint',
    {
      description:
        'Restore config files from a checkpoint made with lowdefy_checkpoint (restores changed files and removes files added since). Omit id to list available checkpoints.',
      inputSchema: {
        id: z.string().optional().describe('Checkpoint id. Omit to list checkpoints.'),
      },
    },
    ({ id }) => {
      if (!id) {
        return textResult(listConfigCheckpoints());
      }
      return textResult(revertConfigCheckpoint({ id }));
    }
  );

  server.registerTool(
    'lowdefy_build_status',
    {
      description:
        'Call after every config edit. Returns the current build status: errors and warnings from the last build (with source file locations), recent browser runtime errors, and recent server errors — request, endpoint, MCP and agent tool failures with their config source. The dev server rebuilds automatically on file change — edit, then call this to see what broke.',
      inputSchema: {},
    },
    () => textResult(getBuildStatus())
  );

  server.registerTool(
    'lowdefy_get_page_config',
    {
      description:
        'Get the fully built config for a page, or its structured build errors if the page fails to build. Use to verify a page after editing it.',
      inputSchema: {
        pageId: z.string().describe('The page id.'),
      },
    },
    async ({ pageId }) => {
      const result = await getPageConfig({ pageId });
      if (result === null) {
        return notFoundResult(
          `Page "${pageId}" not found. Use lowdefy_overview or check pageRegistry for valid page ids.`
        );
      }
      return textResult(result);
    }
  );

  server.registerTool(
    'lowdefy_find_config',
    {
      description:
        'Find where a config entity is defined: pass a page, block, or request id and get the source yaml file (and line where available). For block/request ids also pass the owning pageId so the page is built first.',
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
    async ({ id, pageId }) => textResult(await findConfig({ id, pageId }))
  );

  server.registerTool(
    'lowdefy_screenshot_page',
    {
      description:
        'Screenshot a page of the running dev server (headless Chromium) to visually verify layout and rendering. Returns a PNG image.',
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
        user: userSchema,
      },
    },
    async ({ pageId, fullPage, clip, scrollX, scrollY, user }) => {
      if (!origin) {
        return notFoundResult('Screenshot unavailable: server origin unknown for this transport.');
      }
      const result = await screenshotPage({
        origin,
        pageId,
        fullPage,
        clip,
        scrollX,
        scrollY,
        user,
      });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return { content: [{ type: 'image', data: result.data, mimeType: result.mimeType }] };
    }
  );

  server.registerTool(
    'lowdefy_scaffold_page',
    {
      description:
        'Create a new page yaml file with a canonical minimal structure. Refuses if the page already exists. Returns the created file path and the lowdefy.yaml registration step you must do next.',
      inputSchema: {
        pageId: z.string().describe('The new page id (letters, numbers, - and _).'),
        title: z.string().optional().describe('Page title. Defaults to the pageId.'),
      },
    },
    ({ pageId, title }) => {
      const result = scaffoldPage({ pageId, title });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return textResult(result);
    }
  );

  server.registerTool(
    'lowdefy_overview',
    {
      description:
        'Start here. Overview of everything this Lowdefy project has available: counts of blocks/operators/actions/connections/requests, installed plugins, doc sections, and which tool to use next.',
      inputSchema: {},
    },
    () => textResult(getOverview())
  );

  server.registerTool(
    'lowdefy_list_types',
    {
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
    ({ kind }) => textResult(listTypes({ kind }))
  );

  server.registerTool(
    'lowdefy_list_plugins',
    {
      description:
        "List installed plugin packages (including this project's local custom plugins) and the type names each provides.",
      inputSchema: {},
    },
    () => textResult(listPlugins())
  );

  server.registerTool(
    'lowdefy_get_schema',
    {
      description:
        'Get the JSON Schema for a specific type: all properties, events, and their descriptions. Use the exact type name from lowdefy_list_types.',
      inputSchema: {
        kind: z
          .enum(['blocks', 'operators', 'actions', 'connections', 'requests'])
          .describe('The kind of the type.'),
        type: z.string().describe('The exact type name, e.g. "Button", "_get", "MongoDBFind".'),
      },
    },
    ({ kind, type }) => {
      const schema = getSchema({ kind, type });
      if (schema === null) {
        return notFoundResult(
          `No schema found for ${kind} type "${type}". Use lowdefy_list_types to see available types.`
        );
      }
      return textResult(schema);
    }
  );

  server.registerTool(
    'lowdefy_get_examples',
    {
      description:
        'Get real YAML usage examples for a block type (gallery and example configs shipped with the plugin).',
      inputSchema: {
        type: z.string().describe('The exact block type name, e.g. "Button".'),
      },
    },
    ({ type }) => {
      const examples = getExamples({ type });
      if (examples === null) {
        return notFoundResult(
          `No examples shipped for block type "${type}". Use lowdefy_get_schema for its contract, or lowdefy_get_doc for its documentation page.`
        );
      }
      return textResult(examples);
    }
  );

  server.registerTool(
    'lowdefy_get_doc',
    {
      description:
        'Get a core Lowdefy documentation page as markdown. Look up by slug (e.g. "concepts/lowdefy-schema", "operators/_get") or by kind + type name. Key concept slugs: concepts/lowdefy-schema, concepts/blocks, concepts/events-and-actions, concepts/connections-and-requests, concepts/operators, concepts/page-and-app-state.',
      inputSchema: {
        slug: z.string().optional().describe('Doc slug, e.g. "operators/_get".'),
        kind: z
          .enum(['block', 'operator', 'action', 'connection'])
          .optional()
          .describe('Kind of the type to find the doc for.'),
        type: z.string().optional().describe('Type name to find the doc for, e.g. "_get".'),
      },
    },
    ({ slug, kind, type }) => {
      const doc = getCoreDoc({ slug, kind, type });
      if (doc === null) {
        return notFoundResult(
          `No doc found${slug ? ` for slug "${slug}"` : ''}${
            type ? ` for type "${type}"` : ''
          }. Use lowdefy_search_docs to find the right slug.`
        );
      }
      return textResult(doc.markdown);
    }
  );

  server.registerTool(
    'lowdefy_search_docs',
    {
      description: 'Search the core Lowdefy docs by keyword. Returns matching slugs with snippets.',
      inputSchema: {
        query: z.string().describe('Search keywords.'),
      },
    },
    ({ query }) => textResult(searchDocs({ query }))
  );

  server.registerTool(
    'lowdefy_get_plugin_doc',
    {
      description:
        "Get markdown documentation shipped inside an installed plugin package (README, guides). Useful for this project's local custom plugins.",
      inputSchema: {
        package: z.string().describe('The package name, e.g. "@lowdefy/blocks-antd".'),
      },
    },
    ({ package: packageName }) => {
      const doc = getPluginDoc({ packageName });
      if (doc === null) {
        return notFoundResult(
          `Package "${packageName}" ships no markdown docs. Use lowdefy_list_types and lowdefy_get_schema for its types.`
        );
      }
      return textResult(doc.markdown);
    }
  );

  return server;
}

export default createDocsMcpServer;
