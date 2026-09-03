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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// A block id is a dot-separated state path. Segments starting with "~" are the
// marker namespace (~k, ~r, ~l) and segments must not be empty, because either
// makes the resulting path unaddressable by _state/_get. "$" is a legal segment:
// it is the List index token that applyArrayIndices resolves at runtime.
const RESERVED_SEGMENT_PREFIX = '~';

// The one way to build a namespaced block id. Every generator that puts a block
// under another block's id — component expansion, dynamic block prefixes,
// archetype row cells — should produce its ids here so the reserved-segment
// rule is stated once.
function namespaceBlockId({ prefix, id, configKey }) {
  if (!type.isString(prefix) || prefix === '') {
    throw new ConfigError('Block id prefix should be a non-empty string.', {
      received: prefix,
      configKey,
      checkSlug: 'component',
    });
  }
  if (!type.isString(id) || id === '') {
    throw new ConfigError('Block id should be a non-empty string.', {
      received: id,
      configKey,
      checkSlug: 'component',
    });
  }
  const segments = id.split('.');
  for (const segment of segments) {
    if (segment === '') {
      throw new ConfigError(`Block id "${id}" has an empty path segment.`, {
        received: id,
        configKey,
        checkSlug: 'component',
      });
    }
    if (segment.startsWith(RESERVED_SEGMENT_PREFIX)) {
      throw new ConfigError(
        `Block id "${id}" has a reserved path segment "${segment}". Block id segments may not start with "~".`,
        { received: id, configKey, checkSlug: 'component' }
      );
    }
  }
  return `${prefix}.${id}`;
}

export default namespaceBlockId;
