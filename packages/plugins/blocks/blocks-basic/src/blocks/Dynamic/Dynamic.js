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
import { blockRootProps, withBlockDefaults } from '@lowdefy/block-utils';

// Server-resolved container. The server fills the content slot at page get by
// calling the configured api endpoint — by the time config reaches the client,
// content holds the resolved blocks (or the fallback blocks on failure).
const Dynamic = ({ blockId, classNames, content, events, methods, styles }) => {
  return (
    <div
      {...blockRootProps({
        blockId,
        classNames,
        styles,
        style: { outline: 'none', cursor: events.onClick && 'pointer' },
      })}
      onClick={() => methods.triggerEvent({ name: 'onClick' })}
    >
      {content.content && content.content()}
    </div>
  );
};

export default withBlockDefaults(Dynamic);
