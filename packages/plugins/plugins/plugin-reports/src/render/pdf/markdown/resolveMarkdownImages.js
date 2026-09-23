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

import { resolveImage } from '../../resolveImage.js';
import collectDefinitions from './collectDefinitions.js';
import collectImageUrls from './collectImageUrls.js';
import parseMarkdown from './parseMarkdown.js';

/**
 * Acquire bytes for every markdown image before the synchronous translation,
 * mirroring how resolveImages handles image nodes: acquisition is async, the
 * mapping is not. Every source routes through the one central resolveImage, so
 * markdown images obey exactly the same guardrails as an Img block. The parsed
 * tree is attached alongside the resolved images so the translation step does
 * not parse the same source twice.
 *
 * @param {object} node A markdown IR node.
 * @param {object} [options] origin, publicDirectory and logger, passed to
 *   resolveImage.
 * @returns {Promise<object>} a new node carrying tree and images.
 */
async function resolveMarkdownImages(node, { origin, publicDirectory, logger } = {}) {
  const tree = parseMarkdown(node.markdown);
  const urls = collectImageUrls(tree, collectDefinitions(tree));
  if (urls.length === 0) return { ...node, tree };

  const resolved = await Promise.all(
    urls.map(async (url) => {
      const image = await resolveImage({ src: url, origin, publicDirectory, logger });
      if (image === null) return null;
      return [url, `data:${image.mime};base64,${image.buffer.toString('base64')}`];
    })
  );
  return { ...node, tree, images: Object.fromEntries(resolved.filter((entry) => entry !== null)) };
}

export default resolveMarkdownImages;
