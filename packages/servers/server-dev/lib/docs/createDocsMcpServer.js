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
import { createTraceId, type } from '@lowdefy/helpers';
import { validateJourneyUser } from '@lowdefy/node-utils';

import checkpointToMocks from './checkpointToMocks.js';
import createConfigCheckpoint from './createConfigCheckpoint.js';
import deviceAction from './device/deviceAction.js';
import { subscribe as subscribeToDevEvents } from './devEventBus.js';
import evalOperator from './evalOperator.js';
import findConfig from './findConfig.js';
import getAppMap from './getAppMap.js';
import getBuildStatus from './getBuildStatus.js';
import getBuildStatusAfterEdits from './getBuildStatusAfterEdits.js';
import readJourneySession from './readJourneySession.js';
import readProxyBuildWait from './readProxyBuildWait.js';
import getDoc from './getDoc.js';
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
import runCheck from './runCheck.js';
import runEndpoint from './runEndpoint.js';
import runJourney from './runJourney.js';
import runJourneyAsUsers from './runJourneyAsUsers.js';
import selectExercised from './selectExercised.js';
import runDeviceJourney from './device/runDeviceJourney.js';
import runRequest from './runRequest.js';
import snapshotState from './snapshotState.js';
import { listStateCheckpoints } from './checkpointStore.js';
import createLogger from '../server/log/createLogger.js';
import lowdefyConfig from '../build/config.js';
import devToolDefinitions, { INSTRUCTIONS } from './devToolDefinitions.js';
import scaffoldPage from './scaffoldPage.js';
import screenshotDevice from './device/screenshotDevice.js';
import screenshotPage from './screenshotPage.js';
import searchDocs from './searchDocs.js';
import searchIcons from './searchIcons.js';

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

// A screenshot result (screenshotPage, or screenshotDevice for a phone) as MCP
// content. The final capture shows the page where the steps (or the failing
// step) left it; the images of `screenshot` steps follow it in step order, named
// in the JSON. A phone's capture also says how it was taken.
function imageResult(result) {
  if (result.error) {
    return notFoundResult(result.error);
  }
  const image = { type: 'image', data: result.data, mimeType: result.mimeType };
  const fromDevice = !type.isUndefined(result.device);
  if (!fromDevice && !result.failure && result.screenshots.length === 0) {
    return { content: [image] };
  }
  const summary = { passed: !result.failure, failure: result.failure };
  if (fromDevice) {
    summary.device = result.device;
    summary.capture = result.capture;
    if (!type.isUndefined(result.note)) {
      summary.note = result.note;
    }
  }
  if (result.screenshots.length > 0) {
    summary.screenshots = result.screenshots.map(({ name }) => ({ name }));
  }
  return {
    content: [
      { type: 'text', text: JSON.stringify(summary, null, 2) },
      image,
      ...result.screenshots.map(({ data, mimeType }) => ({ type: 'image', data, mimeType })),
    ],
  };
}

// A journey result's PNGs travel as image content blocks (the shape
// lowdefy_screenshot_page returns) so an MCP client renders them; the JSON keeps
// only their names.
function journeyResult({ summary, screenshots }) {
  return {
    content: [
      { type: 'text', text: JSON.stringify(summary, null, 2) },
      ...screenshots.map(({ data, mimeType }) => ({ type: 'image', data, mimeType })),
    ],
  };
}

// The params a tool takes for the headless browser mean nothing on a phone:
// named back to the agent rather than silently dropped.
function deviceParamsError({ tool, params, names }) {
  const given = names.filter((name) => !type.isNone(params[name]));
  if (given.length === 0) {
    return null;
  }
  return notFoundResult(
    `${tool} with device acts on the phone as it is: ${given.join(', ')} ${
      given.length === 1 ? 'applies' : 'apply'
    } to the headless browser only. Leave ${
      given.length === 1 ? 'it' : 'them'
    } out, or leave device out.`
  );
}

function createDocsMcpServer({ origin, honoContext, version } = {}) {
  const server = new McpServer(
    { name: 'lowdefy', version },
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

  registerDevTool(
    'lowdefy_inspect_state',
    async ({ pageId, pathParams, source, user, data, device }) => {
      const result = await inspectState({ origin, pageId, pathParams, source, user, data, device });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return textResult(result);
    }
  );

  registerDevTool('lowdefy_device', async ({ action, platform, device, inject }) => {
    const result = await deviceAction({
      action,
      platform,
      device,
      inject,
      origin,
      log: (message) => logger.info({ event: 'lowdefy_device' }, message),
    });
    if (result.error) {
      return notFoundResult(result.error);
    }
    return textResult(result);
  });

  registerDevTool(
    'lowdefy_eval_operator',
    async ({ pageId, pathParams, expression, source, user, data }) => {
      const result = await evalOperator({
        origin,
        pageId,
        pathParams,
        expression,
        source,
        user,
        data,
      });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return textResult(result);
    }
  );

  registerDevTool(
    'lowdefy_run_request',
    async ({ pageId, requestId, payload, user, data, saveResponse }) =>
      textResult(
        await runRequest({ pageId, requestId, payload, user, data, saveResponse, honoContext })
      )
  );

  registerDevTool(
    'lowdefy_run_endpoint',
    async ({ endpointId, payload, user, data, system, saveResponse }) =>
      textResult(
        await runEndpoint({ endpointId, payload, user, data, system, saveResponse, honoContext })
      )
  );

  registerDevTool('lowdefy_restart', ({ reason }) =>
    textResult({
      ...requestRestart({ reason }),
      note: 'The dev server is restarting. Call GET /lowdefy-docs/build-status?wait=true (lowdefy_build_status with wait: true) before your next call; it answers once the server is back.',
    })
  );

  registerDevTool('lowdefy_app_map', () => textResult(getAppMap()));

  registerDevTool(
    'lowdefy_snapshot_state',
    async ({ pageId, pathParams, name, notes, source, overwrite, device }) => {
      const result = await snapshotState({
        origin,
        pageId,
        pathParams,
        name,
        notes,
        source,
        overwrite,
        device,
      });
      if (result.error) {
        return notFoundResult(result.error);
      }
      return textResult(result);
    }
  );

  registerDevTool('lowdefy_load_state', async ({ name, mode, user, data, device }) => {
    const result = await loadState({ origin, name, mode, user, data, device });
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

  registerDevTool('lowdefy_check', async () => textResult(await runCheck()));

  registerDevTool('lowdefy_build_status', async ({ wait }) => {
    if (wait === true) {
      const proxyWait = readProxyBuildWait({
        getHeader: (name) => honoContext?.req.header(name),
      });
      return textResult(await getBuildStatusAfterEdits({ proxyWait }));
    }
    return textResult(await getBuildStatus());
  });

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
    async ({
      pageId,
      pathParams,
      urlQuery,
      steps,
      fullPage,
      clip,
      scrollX,
      scrollY,
      user,
      data,
      width,
      height,
      colorScheme,
      device,
    }) => {
      if (!type.isNone(device)) {
        const refused = deviceParamsError({
          tool: 'lowdefy_screenshot_page',
          params: {
            urlQuery,
            fullPage,
            clip,
            scrollX,
            scrollY,
            width,
            height,
            colorScheme,
            user,
            data,
          },
          names: [
            'urlQuery',
            'fullPage',
            'clip',
            'scrollX',
            'scrollY',
            'width',
            'height',
            'colorScheme',
            'user',
            'data',
          ],
        });
        if (refused !== null) {
          return refused;
        }
        return imageResult(await screenshotDevice({ device, pageId, pathParams, steps }));
      }
      if (!origin) {
        return notFoundResult('Screenshot unavailable: server origin unknown for this transport.');
      }
      const result = await screenshotPage({
        origin,
        pageId,
        pathParams,
        urlQuery,
        steps,
        fullPage,
        clip,
        scrollX,
        scrollY,
        user,
        data,
        width,
        height,
        colorScheme,
      });
      return imageResult(result);
    }
  );

  registerDevTool(
    'lowdefy_run_journey',
    async ({
      pageId,
      pathParams,
      steps,
      user,
      urlQuery,
      state,
      timeout,
      data,
      exercised,
      device,
    }) => {
      if (!type.isNone(device)) {
        const refused = deviceParamsError({
          tool: 'lowdefy_run_journey',
          params: { urlQuery, user, data, exercised },
          names: ['urlQuery', 'user', 'data', 'exercised'],
        });
        if (refused !== null) {
          return refused;
        }
        const result = await runDeviceJourney({
          device,
          pageId,
          pathParams,
          steps,
          stepTimeout: timeout,
          state,
        });
        if (result.error) {
          return notFoundResult(result.error);
        }
        const { screenshots, ...rest } = result;
        return journeyResult({
          summary: { ...rest, screenshots: screenshots.map(({ name }) => ({ name })) },
          screenshots,
        });
      }
      if (!origin) {
        return notFoundResult('Journey unavailable: server origin unknown for this transport.');
      }
      const { error: userError } = validateJourneyUser({ user, data });
      if (userError) {
        return notFoundResult(userError);
      }
      // One params object for both branches, so neither can drop a parameter
      // the other passes. basePath is read as the HTTP route reads it, so
      // expect.calls counts and app errors match under a basePath.
      const params = {
        origin,
        pageId,
        pathParams,
        steps,
        urlQuery,
        state,
        stepTimeout: timeout,
        data,
        basePath: lowdefyConfig.basePath ?? '',
      };
      if (type.isArray(user)) {
        const { passed, runs } = await runJourneyAsUsers({ ...params, users: user });
        // Every run's screenshots follow the JSON as images, run by run in
        // the order of the runs, each named in its run.
        const summary = {
          passed,
          runs: runs.map(({ screenshots = [], exercised: runExercised, ...run }) => ({
            ...run,
            ...selectExercised({ exercised: runExercised, selection: exercised }),
            screenshots: screenshots.map(({ name }) => ({ name })),
          })),
        };
        return {
          content: [
            { type: 'text', text: JSON.stringify(summary, null, 2) },
            ...runs.flatMap(({ screenshots = [] }) =>
              screenshots.map(({ data: image, mimeType }) => ({
                type: 'image',
                data: image,
                mimeType,
              }))
            ),
          ],
        };
      }
      const result = await runJourney({
        ...params,
        user,
        // Each call is its own journey run, recorded apart from the suite's.
        recording: { source: 'journey', run: { id: createTraceId(), by: 'agent', journey: null } },
      });
      if (result.error) {
        return notFoundResult(result.error);
      }
      const { screenshots, exercised: resultExercised, ...rest } = result;
      const summary = {
        ...rest,
        ...selectExercised({ exercised: resultExercised, selection: exercised }),
        screenshots: screenshots.map(({ name }) => ({ name })),
      };
      return journeyResult({ summary, screenshots });
    }
  );

  registerDevTool('lowdefy_scaffold_page', ({ pageId, title }) => {
    const result = scaffoldPage({ pageId, title });
    if (result.error) {
      return notFoundResult(result.error);
    }
    return textResult(result);
  });

  registerDevTool('lowdefy_overview', () => textResult(getOverview()));

  registerDevTool('lowdefy_list_types', ({ kind, target }) =>
    textResult(listTypes({ kind, target }))
  );

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
    const doc = getDoc({ slug, kind, type });
    if (doc === null) {
      return notFoundResult(
        `No doc found${slug ? ` for slug "${slug}"` : ''}${
          type ? ` for type "${type}"` : ''
        }. Use lowdefy_search_docs to find the right slug.`
      );
    }
    return textResult(appendHazards(doc));
  });

  registerDevTool('lowdefy_search_docs', ({ query, source }) =>
    textResult(searchDocs({ query, source }))
  );

  registerDevTool('lowdefy_search_icons', async ({ query, limit }) =>
    textResult(await searchIcons({ query, limit }))
  );

  registerDevTool('lowdefy_get_plugin_doc', ({ package: packageName }) => {
    const doc = getPluginDoc({ packageName });
    if (doc === null) {
      return notFoundResult(
        `Package "${packageName}" ships no markdown docs. Use lowdefy_list_types and lowdefy_get_schema for its types.`
      );
    }
    return textResult(doc.markdown);
  });

  registerDevTool('lowdefy_journey_session', ({ id, since }) => {
    const result = readJourneySession({ id, since });
    if (!type.isUndefined(result.error)) {
      return notFoundResult(result.error);
    }
    return textResult(result.text);
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
