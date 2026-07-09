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

import findConfig from './findConfig.js';
import getBuildStatus from './getBuildStatus.js';
import getCoreDoc from './getCoreDoc.js';
import getExamples from './getExamples.js';
import getOverview from './getOverview.js';
import getPageConfig from './getPageConfig.js';
import getPluginDoc from './getPluginDoc.js';
import getSchema from './getSchema.js';
import listPlugins from './listPlugins.js';
import listTypes from './listTypes.js';
import scaffoldPage from './scaffoldPage.js';
import screenshotPage from './screenshotPage.js';
import searchDocs from './searchDocs.js';

const INSTRUCTIONS = `Lowdefy documentation and feedback server for this project. Lowdefy apps are YAML config composing blocks (UI), operators (logic), actions (event handlers), and connections/requests (data).

Discovery workflow: start with lowdefy_overview. Use lowdefy_list_types with a kind to discover ALL installed blocks/operators/actions/connections/requests — never guess type names. Then lowdefy_get_schema and lowdefy_get_examples for the exact contract of a type, and lowdefy_get_doc / lowdefy_search_docs for concept documentation. lowdefy_list_plugins and lowdefy_get_plugin_doc cover this project's local plugin packages.

Feedback loop: after EVERY config edit, call lowdefy_build_status — the dev server rebuilds on file change and this returns the current build errors/warnings (with source file locations) plus recent browser runtime errors. Fix what it reports, then confirm the page builds with lowdefy_get_page_config, and visually verify with lowdefy_screenshot_page. Use lowdefy_find_config to locate where any id (page, block, request) is defined. lowdefy_scaffold_page creates a canonical new page file.`;

function textResult(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: 'text', text }] };
}

function notFoundResult(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function createDocsMcpServer({ origin } = {}) {
  const server = new McpServer(
    { name: 'lowdefy-docs', version: '1.0.0' },
    { instructions: INSTRUCTIONS }
  );

  server.registerTool(
    'lowdefy_build_status',
    {
      description:
        'Call after every config edit. Returns the current build status: errors and warnings from the last build (with source file locations), plus recent browser runtime errors. The dev server rebuilds automatically on file change — edit, then call this to see what broke.',
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
          .describe('The page the id belongs to — required for block/request ids on pages not yet built.'),
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
      },
    },
    async ({ pageId, fullPage }) => {
      if (!origin) {
        return notFoundResult('Screenshot unavailable: server origin unknown for this transport.');
      }
      const result = await screenshotPage({ origin, pageId, fullPage });
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
        'List installed plugin packages (including this project\'s local custom plugins) and the type names each provides.',
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
          `No doc found${slug ? ` for slug "${slug}"` : ''}${type ? ` for type "${type}"` : ''}. Use lowdefy_search_docs to find the right slug.`
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
        'Get markdown documentation shipped inside an installed plugin package (README, guides). Useful for this project\'s local custom plugins.',
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
