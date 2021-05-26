/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { type, serializer } from '@lowdefy/helpers';

async function JsAction({ context, params }) {
  if (!type.isString(params.name)) {
    throw new Error(`JsAction requires a string for 'params.name'.`);
  }
  if (!type.isNone(params.args) && !type.isArray(params.args)) {
    throw new Error(`JsAction requires a array for 'params.args'.`);
  }
  if (!type.isFunction(context.lowdefy.imports.jsActions[params.name])) {
    throw new Error(`JsAction ${params.name} is not a function.`);
  }
  return context.lowdefy.imports.jsActions[params.name](
    {
      ...serializer.copy({
        user: context.lowdefy.user,
        global: context.lowdefy.lowdefyGlobal,
        state: context.state,
        urlQuery: context.lowdefy.urlQuery,
        input: context.lowdefy.inputs[context.id],
      }),
      contextId: context.id,
      pageId: context.pageId,
      requests: { ...context.requests },
    },
    ...(params.args || [])
  );
}

export default JsAction;
