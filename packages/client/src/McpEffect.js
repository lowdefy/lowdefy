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

import { useEffect } from 'react';
import { type } from '@lowdefy/helpers';

// A view's host changes how it shows the view (inline, fullscreen, picture in picture) while the
// page is up. The engine re-evaluates the blocks that read _mcp: displayMode. A page in a browser
// tab has no MCP host and listens to nothing.
const McpEffect = ({ context, lowdefy }) => {
  useEffect(() => {
    const { mcp } = lowdefy._internal;
    if (type.isNone(mcp)) {
      return undefined;
    }
    // The host may have changed the mode between the context's last evaluation and this mount.
    context._internal.updateMcp();
    return mcp.onContextChange(() => context._internal.updateMcp());
  }, [context, lowdefy]);
  return null;
};

export default McpEffect;
