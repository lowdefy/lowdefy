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

import { VIEW_RESOURCE_URI } from './mcpViewNames.js';

// The _meta of a tool with a view. ui.resourceUri is the MCP Apps key; the flat
// ui/resourceUri is its older form, which some hosts still read. An entry point
// lists the view outside a conversation, where the host calls the tool with no
// arguments - the build refuses entrypoint on a tool that requires any.
function getViewToolMeta({ view }) {
  const meta = {
    ui: { resourceUri: VIEW_RESOURCE_URI },
    'ui/resourceUri': VIEW_RESOURCE_URI,
  };
  if (view.entrypoint === true) {
    meta['openai/ui'] = { entrypoints: [{ type: 'global' }] };
  }
  return meta;
}

export default getViewToolMeta;
