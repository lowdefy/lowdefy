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

import React from 'react';
import { BlockLayout, blockLayoutIsRendered } from '@lowdefy/layout';

// The wrapper carries layout and nothing else. The block's `class:` and `style:`
// are on the block's own root, put there by blockRootProps, so applying them here
// too would render them twice - once on a div that only sometimes exists.
function withBlockLayout({ id, inArea, layout }, element) {
  if (!blockLayoutIsRendered({ inArea, layout })) return element;
  return (
    <BlockLayout id={id} layout={layout}>
      {element}
    </BlockLayout>
  );
}

export default withBlockLayout;
