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
import { type } from '@lowdefy/helpers';

import createConfigCheckpoint from './createConfigCheckpoint.js';
import { subscribe as subscribeToDevEvents } from './devEventBus.js';
import evalOperator from './evalOperator.js';
import findConfig from './findConfig.js';
import getAppBrief from './getAppBrief.js';
import getAppMap from './getAppMap.js';
import getDataModel from './getDataModel.js';
import getBuildStatus from './getBuildStatus.js';
import getCoreDoc from './getCoreDoc.js';
import getExamples from './getExamples.js';
import getMigrationsStatus from './getMigrationsStatus.js';
import getOverview from './getOverview.js';
import getPageConfig from './getPageConfig.js';
import getPluginDoc from './getPluginDoc.js';
import getProdErrors from './ops/getProdErrors.js';
import getProdRepro from './ops/getProdRepro.js';
import getProdSlow from './ops/getProdSlow.js';
import getProdTrace from './ops/getProdTrace.js';
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
import runCheck from './runCheck.js';
import runJourney from './runJourney.js';
import runMigrate from './runMigrate.js';
import runRequest from './runRequest.js';
import seedFixture from './seedFixture.js';
import snapshotState from './snapshotState.js';
import { listStateCheckpoints } from './checkpointStore.js';
import createLogger from '../server/log/createLogger.js';
import scaffoldPage from './scaffoldPage.js';
import screenshotPage from './screenshotPage.js';
import snapshotPage from './snapshotPage.js';
import searchDocs from './searchDocs.js';

const logger = createLogger({ server: 'lowdefy-dev-mcp' });

const INSTRUCTIONS = `Lowdefy documentation and feedback server for this project. Lowdefy apps are YAML config composing blocks (UI), operators (logic), actions (event handlers), and connections/requests (data).

Discovery workflow: start with lowdefy_overview. Use lowdefy_list_types with a kind to discover ALL installed blocks/operators/actions/connections/requests — never guess type names. Then lowdefy_get_schema and lowdefy_get_examples for the exact contract of a type, and lowdefy_get_doc / lowdefy_search_docs for concept documentation. lowdefy_list_plugins and lowdefy_get_plugin_doc cover this project's local plugin packages.

Push events: build results, server restarts, browser/server errors and fixture seeds arrive as notifications/message from logger "lowdefy" (data.type is one of build, restart, client_error, server_error, fixture_seeded; a build event carries status, errors, warnings and stale; a fixture_seeded event names the fixture and the collections it wrote so you know the data changed under you). Act on them without polling — lowdefy_build_status remains the full picture.

Feedback loop: after EVERY config edit, call lowdefy_build_status — the dev server rebuilds on file change and this returns the current build errors/warnings (with source file locations), recent browser runtime errors, recent server errors (request, endpoint, MCP and agent failures with their config source), and every tenant: none or runAs execution seen this session (under devNotices). Fix what it reports, then confirm the page builds with lowdefy_get_page_config, and visually verify with lowdefy_screenshot_page. Use lowdefy_find_config to locate where any id (page, block, request) is defined. lowdefy_scaffold_page creates a canonical new page file. Use lowdefy_app_brief first to understand an existing app — per page it names what it reads and writes end to end, the journeys and request tests covering it, the declared events nothing tests, and what changed since a git ref; lowdefy_app_map is the structural index behind it, and lowdefy_data_model comes before touching any request, endpoint or connection — it names every collection, its fields, relations and tenant field, and which requests, steps and websockets read or write it. If a tool result begins with "STALE:", the last build FAILED and the answer comes from the previous successful build, not from your latest edits — call lowdefy_build_status and fix the reported errors before trusting anything else.

lowdefy_build_status reports what the dev build saw; lowdefy_check reports what a production build would say — run it before declaring a change done.

Migrations: a shape change to a collection needs a migration file (migrations/<YYYY-MM-DD-NN-name>.yaml, a routine in the endpoint grammar, forward-only, idempotent). lowdefy_build_status carries \`migrations\` — the stage the dev build is for and the migration ids pending or changed against that stage's ledger (.lowdefy/migrations/<stage>.json); a pending migration means the dev database is behind the config. lowdefy_migrations_status gives the full picture (every migration, the ledger entries, the ledger path); lowdefy_migrate applies the pending ones to the dev database and rewrites the ledger (dryRun: true plans only, naming each connection and the database it resolves to; applying needs cli.agentTools.allowWriteRequests). Never edit an applied migration — write a new one.

Live state: lowdefy_inspect_state reads the ACTUAL state, request results, and event log of a running page — when the developer has the page open in their browser it reads THEIR live tab (ask them to interact, then inspect), otherwise it runs the page headless. lowdefy_eval_operator evaluates any operator expression against that live state — use it to debug _state/_request bindings. lowdefy_run_request executes a request with a test payload to verify data shape (read-only unless the app opts into writes). lowdefy_run_endpoint runs an Api endpoint routine headlessly with a test payload (always needs cli.agentTools.allowWriteRequests, since routines are not classified read-only); a :reject comes back as status "reject" with the routine's own error, not as a tool failure. When a request returns an empty or unexpected result on a multi-tenant app, re-run it with explain: true BEFORE changing config — it returns the caller, the connection tenancy, the properties after operator evaluation, the effective query the driver received and every clause the tenant wall injected (rewritten); the wall's injected clauses are the usual cause.

Behaviour, not just layout: a screenshot shows what rendered, not what works. To verify behaviour, drive the page with lowdefy_run_journey — a declarative list of steps (click, fill, set, select, press, wait, screenshot, expect) addressed by blockId — and assert on state, visibility, text, url, the rendered DOM or how long a step took. The same grammar is what tests/journeys/*.yaml uses, so a journey you verify here can be committed as-is. A failing step stops the journey and comes back as data (passed: false, failure with expected/actual, the remaining steps skipped) together with the final page state, so you can read what the app actually did and write the next assertion. Pass user to act as a real member (e.g. {"roles":["admin"]}) when the flow is role-gated.

Role-gated pages: the headless renderer signs in as a roleless user, so a page or request gated on a role renders empty or refused. Pass user to lowdefy_screenshot_page, lowdefy_run_journey, lowdefy_inspect_state, lowdefy_eval_operator, lowdefy_load_state, lowdefy_run_request or lowdefy_run_endpoint to act as a specific caller — e.g. user {"roles":["admin"]} — and vary it per call to compare what different roles see. A request run without user runs as a roleless anonymous caller, so a tenant-walled or role-gated request returns empty rather than an error.

Safety: lowdefy_checkpoint snapshots the config files before risky multi-file changes; lowdefy_revert_checkpoint restores them.

Visual feedback: developers can press Cmd/Ctrl+/ in the running app to point at elements, draw, and copy annotated feedback to their clipboard, then paste it to you. Pasted annotation blocks start with "Feedback:" and carry the blockId, the resolved config file:line, drawn shapes, and usually an "Annotated screenshot:" file path — READ that image to see exactly what the developer drew. Treat them as precise UI feedback and use lowdefy_inspect_state for the page's live state.

State checkpoints (testing): lowdefy_snapshot_state captures a page's live state AND its request/api responses into .lowdefy/state-checkpoints/<name>/ (one file per part; gitignored — checkpoints contain user/session data). lowdefy_load_state puts the app back into that state: headless for your own verification, or registry-only which returns a ?_checkpoint URL the developer can open to manually test the app in that exact state (recorded request data is served automatically until the next build). When asked to write e2e tests, put the data in with fixtures and request tests rather than exporting a checkpoint.`;

const HAZARDS_NOTE =
  ' Results include `hazards`: behaviours of this type that its schema does not show. Read them before writing config.';

// get_doc returns markdown rather than JSON, so hazards resolved for the
// requested type are appended as a section instead of a sibling key.
function appendHazards(doc) {
  if (type.isNone(doc.hazards) || doc.hazards.length === 0) {
    return doc.markdown;
  }
  const lines = doc.hazards.map((hazard) => {
    const see = type.isNone(hazard.see) ? '' : ` (see \`${hazard.see}\`)`;
    return `- **${hazard.id}**: ${hazard.message}${see}`;
  });
  return `${doc.markdown}\n\n## Hazards\n\n${lines.join('\n')}\n`;
}

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
  .union([z.string(), z.object({}).passthrough()])
  .optional()
  .describe(
    'Act as this caller instead of the default roleless headless user, e.g. {"roles":["user-admin"]} to render a role-gated page. A string names a fixture declared under `auth.dev.users` in `lowdefy.yaml`; an object is an inline caller merged over the default. An unknown name is an error, never a fallback. Merged over the default, so include email/profile/attributes fields too if the page reads them — no auth engine runs for an injected caller, so nothing derives them. Headless only: it is never applied to a page the developer opens in their own browser, so combining it with source "tab" or load_state mode "registry-only" is an error rather than a silently dropped role, and on lowdefy_run_request / lowdefy_run_endpoint it sets the caller the request or routine runs as.'
  );

function createDocsMcpServer({ origin, honoContext } = {}) {
  const server = new McpServer(
    { name: 'lowdefy-docs', version: '1.0.0' },
    { capabilities: { logging: {} }, instructions: INSTRUCTIONS }
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
        "Read the LIVE state of a running page: state, request results, event log (recent actions fired), global, user, input, and urlQuery. If the developer has the page open in a browser it reads their actual tab (ask them to interact first, then inspect); otherwise it runs the page headless. Use this to see what the app's data model really looks like. When the page declares a `state:` contract the result also carries `stateSchemaDrift`: an empty array when the live state conforms, otherwise one entry per violation with the state path, the ajv message, the declared fragment and the received value (the key is absent for a page with no contract).",
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
        explain: z
          .boolean()
          .optional()
          .describe(
            'Return the effective request: the caller, the connection tenancy, the properties after operator evaluation, what the driver received, and every clause the tenant wall injected. Non-behavioural.'
          ),
      },
    },
    async ({ pageId, requestId, payload, user, explain }) =>
      textResult(await runRequest({ pageId, requestId, payload, user, explain, honoContext }))
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
        explain: z
          .boolean()
          .optional()
          .describe(
            'Return the effective request: the caller, the connection tenancy, the properties after operator evaluation, what the driver received, and every clause the tenant wall injected. Non-behavioural.'
          ),
      },
    },
    async ({ endpointId, payload, user, explain }) =>
      textResult(await runEndpoint({ endpointId, payload, user, explain, honoContext }))
  );

  server.registerTool(
    'lowdefy_seed_fixture',
    {
      description:
        "Load a named fixture (fixtures/<name>.yaml in the app, keyed by connectionId) into the dev database through the connection layer, so a page has data to show while you build it. Writes to the developer's real dev database, so it is refused unless the app opts in (cli.agentTools.allowWriteRequests in lowdefy.yaml). By default documents are added on top of what is there; reset: true first empties every collection the fixture names (only those - the result lists them with the deleted count). Documents are inserted exactly as written, never tenant-stamped: a fixture must carry its own tenant fields. The same fixtures back `fixtures:` in request tests, so seed with the fixture a test uses to see the tested data live.",
      inputSchema: {
        name: z
          .string()
          .describe('The fixture name: fixtures/<name>.yaml under the config directory.'),
        reset: z
          .boolean()
          .optional()
          .describe(
            'Empty every collection the fixture names before inserting (default false: layer onto existing data).'
          ),
      },
    },
    async ({ name, reset }) => textResult(await seedFixture({ name, reset, honoContext }))
  );

  server.registerTool(
    'lowdefy_migrations_status',
    {
      description:
        'Report the migration state of the dev build: the stage it was built for (STAGE, else local), every migration under migrations/ with whether the stage ledger (.lowdefy/migrations/<stage>.json) records it as applied, the ids pending or changed since applied, and the ledger entries themselves. Call after adding a migration to confirm the build discovered it, and before telling the developer a data-shape change is done — a pending migration means the dev database is behind the config.',
      inputSchema: {},
    },
    async () => textResult(await getMigrationsStatus())
  );

  server.registerTool(
    'lowdefy_migrate',
    {
      description:
        "Apply the pending migrations to the dev database the way `lowdefy migrate` does, for the stage the dev build was made for, and rewrite that stage's ledger file. dryRun: true plans only — it lists the migrations that would run, in order, and for each connection they touch the connection id and the database it resolves to in this environment, with no writes. Applying writes to the developer's real dev database, so it is refused unless the app opts in (cli.agentTools.allowWriteRequests in lowdefy.yaml). Stops at the first failing migration and reports it as data (the ledger entry is not written, so it re-runs once fixed). A checksum mismatch (an applied migration file was edited) is refused; pass allowChecksumMismatch: true only for a known no-op edit.",
      inputSchema: {
        dryRun: z.boolean().optional().describe('Plan only, write nothing (default false).'),
        to: z
          .string()
          .optional()
          .describe('Apply pending migrations up to and including this id; omit to apply all.'),
        allowChecksumMismatch: z
          .boolean()
          .optional()
          .describe(
            'Tolerate an applied migration whose file changed and record its new checksum (default false).'
          ),
      },
    },
    async ({ dryRun, to, allowChecksumMismatch }) =>
      textResult(await runMigrate({ dryRun, to, allowChecksumMismatch }))
  );

  server.registerTool(
    'lowdefy_restart',
    {
      description:
        "Restart the dev server process. Use after editing a local plugin's server-side implementation, or when build_status looks stale. The connection drops: wait about two seconds, then call lowdefy_build_status before continuing. The restart discards the serverErrors and devNotices collected this session, so read anything you still need from build_status first.",
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
        note:
          'The dev server is restarting. Wait ~2s, then poll GET /lowdefy-docs/build-status ' +
          'before your next call. The restart discards the serverErrors and devNotices ' +
          'collected this session — they live in the server process only.',
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
    'lowdefy_app_brief',
    {
      description:
        'What you need before editing, joined from artefacts that already exist — no prose, no guessing. With a pageId: the collections that page reads and writes (its own requests, plus every Api endpoint its CallAPI actions call and what those endpoints read and write), how it is tested (the journeys covering it, the request tests naming it or its endpoints, and every declared (blockId, event) triple no journey exercises), and, with `since`, which of the files changed since that git ref the page is made of and the blocks, requests and endpoints they define. Without a pageId: one line per page — reads, writes, endpoints, journeys, event coverage — sorted changed-first and capped, with what was truncated named. Read this first when picking up work on an existing app; it replaces reading the config files to find out what a page touches.',
      inputSchema: {
        pageId: z
          .string()
          .optional()
          .describe('Brief for this page only. Omit for the whole-app brief.'),
        since: z
          .string()
          .optional()
          .describe(
            'A git ref (sha, tag or branch). Adds what changed between that ref and the working tree, mapped onto the pages, blocks, requests and endpoints the changed files define.'
          ),
      },
    },
    ({ pageId, since }) => {
      const brief = getAppBrief({ pageId, since });
      if (brief.error) {
        return notFoundResult(brief.error);
      }
      const { markdown, ...data } = brief;
      // Markdown first for reading, the same brief as JSON after it for
      // anything the agent wants to address by id.
      return { content: [{ type: 'text', text: markdown }, textResult(data).content[0]] };
    }
  );

  server.registerTool(
    'lowdefy_data_model',
    {
      description:
        "The app's data layer in one call: every collection (declared under collections: in lowdefy.yaml, or discovered from a connection or a literal aggregation pipeline) with its fields, relations, indexes and tenant verdict, the connections addressing it (read/write/tenant), and every page request, routine step and websocket that reads or writes it with the yaml file:line that defines it. Readers and writers are classified by the request type's own checkRead/checkWrite meta plus $lookup/$unionWith/$graphLookup (read) and $merge/$out (write) in literal pipelines. Anything that could not be joined is listed under `unresolved` with a reason — never dropped. Call this before writing a query, a request or a migration.",
      inputSchema: {},
    },
    () => textResult(getDataModel())
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
        "Put the app back into a saved state checkpoint. mode 'headless' (default) verifies the restored state itself; mode 'registry-only' returns a ?_checkpoint URL the developer can open to manually test the app in that exact state. While replayRequests is true (the default) the app's page requests are answered from the checkpoint's recorded responses instead of the database, for every browser tab, until the next build or revert_checkpoint — pass replayRequests: false to restore the state and still call the real connections.",
      inputSchema: {
        name: z.string().describe('The checkpoint name.'),
        mode: z.enum(['headless', 'registry-only']).optional(),
        replayRequests: z
          .boolean()
          .optional()
          .describe(
            "Answer the app's page requests from the checkpoint instead of the database. Default true."
          ),
        user: userSchema,
      },
    },
    async ({ name, mode, replayRequests, user }) => {
      const result = await loadState({ origin, name, mode, replayRequests, user });
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

  // Ops tools (R19). Registered unconditionally and refused at call time with
  // howToEnable — a tool that vanishes from the manifest teaches an agent
  // nothing, and credentials that appear after the MCP session started would
  // leave a stale manifest behind. The refusal is data on the result, not an
  // isError, because "not enabled here" is an answer.
  server.registerTool(
    'lowdefy_prod_errors',
    {
      description:
        "Production failures from the app log sink, grouped. Every group carries `source` (file:line, resolved through this build's keyMap when the row's git_sha matches the running build, otherwise the raw `config_key` and a note saying why) and a `sample_rid` — feed `source` to lowdefy_find_config and `sample_rid` to lowdefy_prod_trace. Reads only what the sink retained (30 days unless the sink says otherwise). Needs LOWDEFY_OPS_QUERY_URL, LOWDEFY_OPS_READ_TOKEN and LOWDEFY_OPS_DATASET, a loopback dev server, and an app that does not set config.ops.enabled: false; otherwise the result is a refusal carrying howToEnable.",
      inputSchema: {
        since: z
          .string()
          .optional()
          .describe(
            '"deploy" (the default) searches from the first process_started event carrying the newest deployed git_sha, or an ISO 8601 timestamp.'
          ),
        group_by: z
          .enum(['source', 'org', 'page', 'endpoint'])
          .optional()
          .describe(
            'Group failures by config location (default), organization (only populated when the app sets logger.events.identity), page or endpoint.'
          ),
        limit: z.number().optional().describe('Maximum groups to return. Defaults to 20.'),
      },
    },
    async ({ since, group_by: groupBy, limit }) =>
      textResult(await getProdErrors({ origin, since, group_by: groupBy, limit }))
  );

  server.registerTool(
    'lowdefy_prod_trace',
    {
      description:
        'Every production event carrying one request id (rid), oldest first: the request, the endpoint steps under it, and the agent tool calls it made, each with its `source` or `config_key`. Use the `sample_rid` from lowdefy_prod_errors, then lowdefy_find_config on the source. Given `session_id` instead, it returns one browser session: the recorded journey_event steps and any feedback_submitted report, oldest first - the `session_id` on a feedback report is what turns it into a reproduction. Pass exactly one of the two. Subject to the sink retention window (30 days by default). Refuses with howToEnable when ops queries are not enabled.',
      inputSchema: {
        rid: z
          .string()
          .optional()
          .describe('The request id from a log line or a lowdefy_prod_errors group.'),
        session_id: z
          .string()
          .optional()
          .describe('The journey session id, as carried on a feedback_submitted report.'),
      },
    },
    async ({ rid, session_id: sessionId }) =>
      textResult(await getProdTrace({ origin, rid, session_id: sessionId }))
  );

  server.registerTool(
    'lowdefy_prod_slow',
    {
      description:
        'The slowest production work by duration percentile, grouped by event, endpoint, step, request and page, each row carrying `source` or `config_key` for lowdefy_find_config. Subject to the sink retention window (30 days by default). Refuses with howToEnable when ops queries are not enabled.',
      inputSchema: {
        endpoint_id: z.string().optional().describe('Restrict to one endpoint id.'),
        page_id: z.string().optional().describe('Restrict to one page id.'),
        percentile: z
          .number()
          .optional()
          .describe('Duration percentile to rank by, 0 < p < 100. Defaults to 95.'),
        since: z.string().optional().describe('"deploy" (the default) or an ISO 8601 timestamp.'),
        limit: z.number().optional().describe('Maximum groups to return. Defaults to 20.'),
      },
    },
    async ({ endpoint_id: endpointId, page_id: pageId, percentile, since, limit }) =>
      textResult(
        await getProdSlow({
          origin,
          endpoint_id: endpointId,
          page_id: pageId,
          percentile,
          since,
          limit,
        })
      )
  );

  server.registerTool(
    'lowdefy_prod_repro',
    {
      description:
        'The raw material for reproducing a production failure: every event carrying the rid, in order, with the page and block ids involved and each event\'s `source`. The trace-to-journey compiler is not landed yet, so the result says note: "compiler pending" and you write the tests/journeys/*.yaml steps yourself from these events (lowdefy_find_config on a source locates the block). Subject to the sink retention window (30 days by default). Refuses with howToEnable when ops queries are not enabled.',
      inputSchema: {
        rid: z.string().describe('The request id of the failing session.'),
      },
    },
    async ({ rid }) => textResult(await getProdRepro({ origin, rid }))
  );

  server.registerTool(
    'lowdefy_build_status',
    {
      description:
        'Call after every config edit. Returns the current build status: errors and warnings from the last build (with source file locations), recent browser runtime errors, recent server errors — request, endpoint, MCP and agent tool failures with their config source — plus every `tenant: none` or `runAs` execution seen this session with its config source, under devNotices. The dev server rebuilds automatically on file change — edit, then call this to see what broke.',
      inputSchema: {},
    },
    () => textResult(getBuildStatus())
  );

  server.registerTool(
    'lowdefy_check',
    {
      description:
        'Run every production build check offline — including the prod-only checks lowdefy dev hides — plus the check-only rules (js lint, tenant audits, contracts). Returns located errors and warnings. Call before telling the developer a change is done.',
      inputSchema: {},
    },
    async () => textResult(await runCheck())
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
    'lowdefy_run_journey',
    {
      description:
        'Drive a page of the running dev server headless through declarative steps and assert what happens — the way to verify behaviour (a form submits, a modal opens, a filter works), not just layout. Blocks are addressed by blockId. A step that fails stops the journey and is returned as data (passed: false, failure with index/step/expected/actual/message, later steps "skipped") — never as a tool error. Always returns the final page state and any screenshots taken (as images after the JSON text).',
      inputSchema: {
        pageId: z.string().describe('The page id to open.'),
        steps: z
          .array(z.record(z.any()))
          .describe(
            'Ordered steps, one key each: {"click": blockId} | {"fill": {"blockId", "value"}} (types into the input/textarea inside the block, falling back to setting the block value when it has neither) | {"set": {"blockId", "value"}} (writes the value straight through the engine, for an input block with no typeable surface — errors on a block that is not an input) | {"select": {"blockId", "value"}} (option by exact text) | {"press": "Enter" | "Mod+k" | {"key", "blockId"?}} (Mod is Meta/Control per platform; blockId presses on that block instead of the page) | {"wait": {"ms": n} | {"request": requestId} | {"state": path}} | {"screenshot": name?} | {"expect": {"state": {"path", "equals"}} | {"visible": blockId} | {"text": {"blockId", "contains"|"equals"|"notContains"}} | {"url": {"contains"}} | {"dom": {"blockId", "hasClass"|"notHasClass"|"matches"|"attribute"+"equals"}} | {"durationMsUnder": n}}. Exactly one key per step and one form per expect. Each step gets 5s; after an interaction the runner waits for a navigation and then for the page\'s pending events and requests to settle. Pages render under fixed locale, timezone and colour scheme, so formatted dates assert the same here as in CI.'
          ),
        fixtures: z
          .array(z.string())
          .optional()
          .describe(
            "Fixture names (fixtures/<name>.yaml) to seed before the page opens, in order, so the journey runs against known rows. Each fixture's collections are emptied first, and this writes to the dev database, so it needs cli.agentTools.allowWriteRequests: true exactly as lowdefy_seed_fixture does. The same key is valid in a committed tests/journeys/*.yaml journey."
          ),
        user: userSchema,
        urlQuery: z
          .record(z.any())
          .optional()
          .describe('Query params to open the page with, read by _url_query, e.g. {"id": "1"}.'),
      },
    },
    async ({ fixtures, pageId, steps, user, urlQuery }) => {
      if (!origin) {
        return notFoundResult('Journey unavailable: server origin unknown for this transport.');
      }
      const result = await runJourney({
        fixtures,
        honoContext,
        origin,
        pageId,
        steps,
        user,
        urlQuery,
      });
      if (result.error) {
        return notFoundResult(result.error);
      }
      // The PNGs travel as image content blocks (the shape lowdefy_screenshot_page
      // returns) so an MCP client renders them; the JSON keeps only their names.
      const { screenshots, ...rest } = result;
      const summary = { ...rest, screenshots: screenshots.map(({ name }) => ({ name })) };
      return {
        content: [
          { type: 'text', text: JSON.stringify(summary, null, 2) },
          ...screenshots.map(({ data, mimeType }) => ({ type: 'image', data, mimeType })),
        ],
      };
    }
  );

  server.registerTool(
    'lowdefy_snapshot',
    {
      description:
        'Take one golden snapshot of a page as a named user under deterministic browser settings (fixed viewport, reduced motion, light scheme, en-US, UTC): the viewport PNG, the app root DOM and the page state, plus the state paths the page declares under `~snapshotIgnore`. This is what `lowdefy snapshot --check` diffs against the committed snapshots/ directory — use it to see exactly what a change did to one page for one role without running the whole suite. An optional journey runs first to reach a state.',
      inputSchema: {
        pageId: z.string().describe('The page id to snapshot.'),
        user: userSchema,
        urlQuery: z
          .record(z.any())
          .optional()
          .describe('Query params to open the page with, read by _url_query, e.g. {"id": "1"}.'),
        journey: z
          .array(z.record(z.any()))
          .optional()
          .describe(
            'Journey steps (same grammar as lowdefy_run_journey) to run before capturing, e.g. [{"click": "open-detail"}]. A failing step is an error, not a snapshot.'
          ),
      },
    },
    async ({ pageId, user, urlQuery, journey }) => {
      if (!origin) {
        return notFoundResult('Snapshot unavailable: server origin unknown for this transport.');
      }
      const result = await snapshotPage({ origin, pageId, user, urlQuery, journey });
      if (result.error) {
        return notFoundResult(result.error);
      }
      // The PNG travels as an image content block so an MCP client renders it;
      // the JSON keeps the DOM, state and ignore paths.
      const { screenshot, ...rest } = result;
      return {
        content: [
          { type: 'text', text: JSON.stringify(rest, null, 2) },
          { type: 'image', data: screenshot, mimeType: 'image/png' },
        ],
      };
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
        'Get the JSON Schema for a specific type: all properties, events, and their descriptions. Also serves the ~ignoreBuildChecks catalogue: kind "checks", type "~ignoreBuildChecks".' +
        " For a block, meta.events maps each event name to { payload } where the block declares one - the JSON Schema of the object _event reads in that event's actions (an _event path outside it is a build error, check slug event-payload); an event with no payload entry declares none. Use the exact type name from lowdefy_list_types." +
        HAZARDS_NOTE,
      inputSchema: {
        kind: z
          .enum(['blocks', 'operators', 'actions', 'connections', 'requests', 'checks'])
          .describe('The kind of the type.'),
        type: z
          .string()
          .describe(
            'The exact type name, e.g. "Button", "_get", "MongoDBFind". With kind "checks", pass "~ignoreBuildChecks" for the full catalogue of build check slugs, or one slug for its description.'
          ),
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
    ({ slug, kind, type }) => {
      const doc = getCoreDoc({ slug, kind, type });
      if (doc === null) {
        return notFoundResult(
          `No doc found${slug ? ` for slug "${slug}"` : ''}${
            type ? ` for type "${type}"` : ''
          }. Use lowdefy_search_docs to find the right slug.`
        );
      }
      return textResult(appendHazards(doc));
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

// Forwards dev events to one connected MCP client as notifications/message
// (the only server→client notification MCP clients surface generically; it
// needs the logging capability declared above). Build failures go out at
// error level so clients that filter by level still see them.
function subscribeMcpServerToDevEvents(server) {
  return subscribeToDevEvents((event) =>
    server.server.sendLoggingMessage({
      level: event.type === 'build' && event.status === 'error' ? 'error' : 'info',
      logger: 'lowdefy',
      data: event,
    })
  );
}

export { subscribeMcpServerToDevEvents };
export default createDocsMcpServer;
