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

import { generateText, jsonSchema, Output } from 'ai';

import buildGenerateCallOptions from './buildGenerateCallOptions.js';

// generateObject is deprecated in ai v6 — structured output is generateText
// with an Output.object spec, which also keeps both handlers on one code path.
async function handleGenerateObject({ model, request }) {
  const result = await generateText({
    model,
    output: Output.object({
      schema: jsonSchema(request.schema),
      name: request.schemaName,
      description: request.schemaDescription,
    }),
    ...buildGenerateCallOptions({ request }),
  });
  return {
    object: result.output,
    reasoningText: result.reasoningText,
    finishReason: result.finishReason,
    usage: result.usage,
    providerMetadata: result.providerMetadata,
    warnings: result.warnings,
  };
}

export default handleGenerateObject;
