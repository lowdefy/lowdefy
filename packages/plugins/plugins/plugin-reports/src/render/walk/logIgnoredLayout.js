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

// Layout features the simplified report grid has no equivalent for. A block
// still renders on its span; these are dropped with a debug line naming them.
const LAYOUT_IGNORED_KEYS = ['order', 'push', 'pull', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];

function logIgnoredLayout({ block, layout, logger }) {
  if (!type.isFunction(logger?.debug)) return;
  const ignored = LAYOUT_IGNORED_KEYS.filter((key) => !type.isNone(layout[key]));
  if (ignored.length === 0) return;
  logger.debug(
    { blockId: block.blockId, ignored },
    `Report layout ignores ${ignored.join(', ')} on block '${block.blockId}'.`
  );
}

export default logIgnoredLayout;
