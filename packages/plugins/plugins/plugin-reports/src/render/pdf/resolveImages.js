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

import { resolveImage } from '../resolveImage.js';
import { resolveMarkdownImages } from './markdownToPdfMake.js';

/**
 * Acquire bytes for every image before the synchronous translation. `toPdfMake`
 * is a pure IR -> docDefinition mapping, but image acquisition is async (disk
 * reads, guarded fetches), so it happens here first. Each image is routed
 * through the one central `resolveImage`; a success attaches a base64 `data` URL
 * to the node, a failure leaves the node unresolved (a warning is logged by the
 * resolver) and the translator skips it. A `markdown` node's images are
 * acquired the same way — its markdown is parsed here and the parsed tree is
 * attached with the resolved image map, so translation parses nothing twice.
 * Returns a new node list; inputs are not mutated.
 *
 * @param {object[]} nodes IR nodes.
 * @param {object} [opts] `origin` (the app's own origin), `publicDirectory`
 *   (the server's copied public/ folder, for relative paths), `logger`.
 * @returns {Promise<object[]>} nodes with resolved images carrying `data`.
 */
async function resolveImages(nodes, { origin, publicDirectory, logger } = {}) {
  const options = { origin, publicDirectory, logger };
  return Promise.all(
    (nodes ?? []).map(async (node) => {
      if (node.kind === 'image') {
        const resolved = await resolveImage({ src: node.src, ...options });
        if (resolved === null) return node;
        const data = `data:${resolved.mime};base64,${resolved.buffer.toString('base64')}`;
        return { ...node, data };
      }
      if (node.kind === 'markdown') {
        return resolveMarkdownImages(node, options);
      }
      if (node.kind === 'row' || node.kind === 'stack') {
        return { ...node, children: await resolveImages(node.children, options) };
      }
      return node;
    })
  );
}

export default resolveImages;
