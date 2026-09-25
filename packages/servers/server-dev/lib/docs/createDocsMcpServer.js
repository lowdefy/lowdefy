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
import { type } from '@lowdefy/helpers';

import checkpointToMocks from './checkpointToMocks.js';
import createConfigCheckpoint from './createConfigCheckpoint.js';
import { subscribe as subscribeToDevEvents } from './devEventBus.js';
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
import runJourney from './runJourney.js';
import runRequest from './runRequest.js';
import snapshotState from './snapshotState.js';
import { listStateCheckpoints } from './checkpointStore.js';
import createLogger from '../server/log/createLogger.js';
import devToolDefinitions, { INSTRUCTIONS } from './devToolDefinitions.js';
import scaffoldPage from './scaffoldPage.js';
import screenshotPage from './screenshotPage.js';
import searchDocs from './searchDocs.js';

const logger = createLogger({ server: 'lowdefy-dev-mcp' });

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

function createDocsMcpServer({ origin, honoContext } = {}) {
  const server = new McpServer(
    { name: 'lowdefy-docs', version: '1.0.0' },
    { capabilities: { logging: {} }, instructions: INSTRUCTIONS }
  );

  // Every tool's contract comes from devToolDefinitions, which the stdio shim
  // also lists, so a tool registered here without a definition - or a
  // definition left without a handler - would make the two disagree.
  // registerDevTool looks the definition up, and the check after the last
  // registration fails the server if any definition was missed.
  //
  // It also debug-logs every tool call (name + args, never the response) so
  // agent activity is visible in the dev terminal with --log-level=debug.
  const registered = new Set();
  function registerDevTool(name, handler) {
    const definition = devToolDefinitions[name];
    if (definition === undefined) {
      throw new Error(`Dev tool "${name}" has no entry in devToolDefinitions.`);
    }
    registered.add(name);
    server.registerTool(name, definition, async (args, extra) => {
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
  }

  registerDevTool('lowdefy_inspect_state', async ({ pageId, source, user }) => {
    const result = await inspectState({ origin, pageId, source, user });
    if (result.error) {
      return notFoundResult(result.error);
    }
    return textResult(result);
  });

  registerDevTool('lowdefy_eval_operator', async ({ pageId, expression, source, user }) => {
    const result = await evalOperator({ origin, pageId, expression, source, user });
    if (result.error) {
      return notFoundResult(result.error);
    }
    return textResult(result);
  });

  registerDevTool('lowdefy_run_request', async ({ pageId, requestId, payload, user }) =>
    textResult(await runRequest({ pageId, requestId, payload, user, honoContext }))
  );

  registerDevTool('lowdefy_run_endpoint', async ({ endpointId, payload, user, system }) =>
    textResult(await runEndpoint({ endpointId, payload, user, system, honoContext }))
  );

  registerDevTool('lowdefy_restart', ({ reason }) =>
    textResult({
      ...requestRestart({ reason }),
      note: 'The dev server is restarting. Wait ~2s, then poll GET /lowdefy-docs/build-status before your next call.',
    })
  );

  registerDevTool('lowdefy_app_map', () => textResult(getAppMap()));

  registerDevTool('lowdefy_snapshot_state', async ({ pageId, name, notes, source, overwrite }) => {
    const result = await snapshotState({ origin, pageId, name, notes, source, overwrite });
    if (result.error) {
      return notFoundResult(result.error);
    }
    return textResult(result);
  });

  registerDevTool('lowdefy_load_state', async ({ name, mode, user }) => {
    const result = await loadState({ origin, name, mode, user });
    if (result.error) {
      return notFoundResult(result.error);
    }
    return textResult(result);
  });

  registerDevTool('lowdefy_list_state_checkpoints', () => textResult(listStateCheckpoints()));

  registerDevTool('lowdefy_checkpoint_to_mocks', ({ name }) => {
    const result = checkpointToMocks({ name });
    if (result.error) {
      return notFoundResult(result.error);
    }
    return textResult(result);
  });

  registerDevTool('lowdefy_checkpoint', ({ label }) =>
    textResult(createConfigCheckpoint({ label }))
  );

  registerDevTool('lowdefy_revert_checkpoint', ({ id }) => {
    if (!id) {
      return textResult(listConfigCheckpoints());
    }
    return textResult(revertConfigCheckpoint({ id }));
  });

  registerDevTool('lowdefy_build_status', () => textResult(getBuildStatus()));

  registerDevTool('lowdefy_get_page_config', async ({ pageId }) => {
    const result = await getPageConfig({ pageId });
    if (result === null) {
      return notFoundResult(
        `Page "${pageId}" not found. Use lowdefy_overview or check pageRegistry for valid page ids.`
      );
    }
    return textResult(result);
  });

  registerDevTool('lowdefy_find_config', async ({ id, pageId }) =>
    textResult(await findConfig({ id, pageId }))
  );

  registerDevTool(
    'lowdefy_screenshot_page',
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

  registerDevTool('lowdefy_run_journey', async ({ pageId, steps, user, urlQuery }) => {
    if (!origin) {
      return notFoundResult('Journey unavailable: server origin unknown for this transport.');
    }
    const result = await runJourney({ origin, pageId, steps, user, urlQuery });
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
  });

  registerDevTool('lowdefy_scaffold_page', ({ pageId, title }) => {
    const result = scaffoldPage({ pageId, title });
    if (result.error) {
      return notFoundResult(result.error);
    }
    return textResult(result);
  });

  registerDevTool('lowdefy_overview', () => textResult(getOverview()));

  registerDevTool('lowdefy_list_types', ({ kind }) => textResult(listTypes({ kind })));

  registerDevTool('lowdefy_list_plugins', () => textResult(listPlugins()));

  registerDevTool('lowdefy_get_schema', ({ kind, type }) => {
    const schema = getSchema({ kind, type });
    if (schema === null) {
      return notFoundResult(
        `No schema found for ${kind} type "${type}". Use lowdefy_list_types to see available types.`
      );
    }
    return textResult(schema);
  });

  registerDevTool('lowdefy_get_examples', ({ type }) => {
    const examples = getExamples({ type });
    if (examples === null) {
      return notFoundResult(
        `No examples shipped for block type "${type}". Use lowdefy_get_schema for its contract, or lowdefy_get_doc for its documentation page.`
      );
    }
    return textResult(examples);
  });

  registerDevTool('lowdefy_get_doc', ({ slug, kind, type }) => {
    const doc = getCoreDoc({ slug, kind, type });
    if (doc === null) {
      return notFoundResult(
        `No doc found${slug ? ` for slug "${slug}"` : ''}${
          type ? ` for type "${type}"` : ''
        }. Use lowdefy_search_docs to find the right slug.`
      );
    }
    return textResult(appendHazards(doc));
  });

  registerDevTool('lowdefy_search_docs', ({ query }) => textResult(searchDocs({ query })));

  registerDevTool('lowdefy_get_plugin_doc', ({ package: packageName }) => {
    const doc = getPluginDoc({ packageName });
    if (doc === null) {
      return notFoundResult(
        `Package "${packageName}" ships no markdown docs. Use lowdefy_list_types and lowdefy_get_schema for its types.`
      );
    }
    return textResult(doc.markdown);
  });

  const unregistered = Object.keys(devToolDefinitions).filter((name) => !registered.has(name));
  if (unregistered.length > 0) {
    throw new Error(`Dev tools defined without a handler: ${unregistered.join(', ')}.`);
  }
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
