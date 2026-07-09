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

import path from 'node:path';
import { resolveConfigLocation } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import buildPageIfNeeded from '../server/jitPageBuilder.js';
import readBuildArtifact from './readBuildArtifact.js';

const MAX_MATCHES = 20;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Array segments in keyMap `key` paths look like `[0:home]` or
// `[2:my_button:Button]` (see packages/build/src/build/addKeys.js recArray) —
// match an id at either position.
function buildIdPattern(id) {
  return new RegExp(`\\[\\d+:${escapeRegExp(id)}(:[^\\]]*)?\\]`);
}

function scanKeyMap({ id, keyMap, refMap, configDirectory }) {
  const pattern = buildIdPattern(id);
  const matches = [];
  for (const [keyId, entry] of Object.entries(keyMap)) {
    if (matches.length >= MAX_MATCHES) {
      break;
    }
    if (type.isString(entry?.key) && pattern.test(entry.key)) {
      matches.push({
        keyPath: entry.key,
        location: resolveConfigLocation({ configKey: keyId, keyMap, refMap, configDirectory }),
      });
    }
  }
  return matches;
}

// Locates a block/request/connection/etc by id, or a page by pageId. Block
// content only exists in keyMap once its page has been JIT-built (see
// lib/server/jitPageBuilder.js), so pass `pageId` to force-build and scan a
// specific page. Never throws on not-found — agents should be able to treat
// "no matches" as a normal result and try another id or pageId.
async function findConfig({ id, pageId }) {
  if (type.isNone(id) || !type.isString(id)) {
    throw new Error(
      `findConfig requires an "id" string. Received ${JSON.stringify(id)}. ` +
        'Use GET /lowdefy-docs/find/:id.'
    );
  }

  const pageRegistry = readBuildArtifact({ name: 'pageRegistry.json' }) ?? {};
  if (pageRegistry[id]) {
    return { kind: 'page', pageId: id, file: pageRegistry[id].refPath };
  }

  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();

  if (!type.isNone(pageId)) {
    if (!pageRegistry[pageId]) {
      return {
        matches: [],
        note:
          `Unknown pageId "${pageId}". See GET /lowdefy-docs/find/${id} without ?pageId= ` +
          'to scan all already-built pages, or check the pageId spelling.',
      };
    }

    const buildDirectory = path.join(process.cwd(), 'build');
    try {
      await buildPageIfNeeded({ pageId, buildDirectory, configDirectory });
    } catch (error) {
      return {
        matches: [],
        note: `Page "${pageId}" failed to build, so its config could not be scanned: ${error.message}`,
      };
    }

    const keyMap = readBuildArtifact({ name: 'keyMap.json' }) ?? {};
    const refMap = readBuildArtifact({ name: 'refMap.json' }) ?? {};
    const matches = scanKeyMap({ id, keyMap, refMap, configDirectory });
    return matches.length > 0
      ? { matches }
      : { matches, note: `No config found with id "${id}" on page "${pageId}".` };
  }

  const keyMap = readBuildArtifact({ name: 'keyMap.json' }) ?? {};
  const refMap = readBuildArtifact({ name: 'refMap.json' }) ?? {};
  const matches = scanKeyMap({ id, keyMap, refMap, configDirectory });
  return {
    matches,
    note:
      'Scanned without a pageId — content on pages that have not been JIT-built yet is not ' +
      'in keyMap and was not covered. Pass ?pageId= to force-build and scan a specific page.',
  };
}

export default findConfig;
