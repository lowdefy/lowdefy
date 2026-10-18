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

import { serializer, type } from '@lowdefy/helpers';

import findPageContext from './findPageContext.js';

/**
 * The answer to an eval-request: the operator expression evaluated with the page instance's own
 * parser, `{ value, errors }`, as a browser tab answers it (server-dev client/Inspector.jsx). The
 * expression may arrive as JSON text, as an MCP tool argument passes it.
 */
function answerEval({ expression, lowdefy, page }) {
  const { context, error } = findPageContext({ lowdefy, page });
  if (error) {
    return { error };
  }
  const input = type.isString(expression) ? JSON.parse(expression) : expression;
  const { output, errors } = context._internal.parser.parse({ input, location: 'agent_eval' });
  return {
    value: serializer.serializeToString(output),
    errors: errors.map((parseError) => parseError.message),
  };
}

export default answerEval;
