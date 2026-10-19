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

// The mcpToken model is declared only beside the MCP authorization server -
// getBetterAuthConfig registers it with auth.oauthProvider. Without the AS the
// MCP route authenticates nobody, so a token would reach nothing, and there is
// no model for the adapter to read or write. Keyed on the model name every
// adapter call already uses, not on the declaring plugin's id.
function hasMcpTokenModel({ auth }) {
  return (auth.options?.plugins ?? []).some((plugin) => !type.isNone(plugin?.schema?.mcpToken));
}

export default hasMcpTokenModel;
