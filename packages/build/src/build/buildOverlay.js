/* eslint-disable no-param-reassign */

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
import collectExceptions from '../utils/collectExceptions.js';

// Resolve the app-level `overlay` config into context fields that
// injectOverlayBlocks (called per page in buildPages) reads to prepend the
// overlay blocks onto every page. Keeping resolution here, separate from
// injection, lets both the full build and the dev JIT build share the same
// stash + injector.
function buildOverlay({ components, context }) {
  context.overlayBlocks = [];
  context.overlayExclude = new Set();

  const overlay = components.overlay;
  if (type.isNone(overlay)) return components;

  if (!type.isObject(overlay)) {
    collectExceptions(
      context,
      new ConfigError('App "overlay" should be an object.', {
        received: overlay,
        configKey: overlay?.['~k'],
      })
    );
    return components;
  }

  // devOnly overlays are injected only by `lowdefy dev` (JIT, stage 'dev'),
  // never baked into a `lowdefy build` production output.
  if (overlay.devOnly === true && context.stage !== 'dev') {
    return components;
  }

  if (!type.isNone(overlay.exclude)) {
    if (!type.isArray(overlay.exclude)) {
      collectExceptions(
        context,
        new ConfigError('App "overlay.exclude" should be an array of pageIds.', {
          received: overlay.exclude,
          configKey: overlay['~k'],
        })
      );
    } else {
      context.overlayExclude = new Set(overlay.exclude.filter(type.isString));
    }
  }

  if (!type.isNone(overlay.blocks)) {
    if (!type.isArray(overlay.blocks)) {
      collectExceptions(
        context,
        new ConfigError('App "overlay.blocks" should be an array.', {
          received: overlay.blocks,
          configKey: overlay['~k'],
        })
      );
    } else {
      context.overlayBlocks = overlay.blocks;
    }
  }

  return components;
}

export default buildOverlay;
