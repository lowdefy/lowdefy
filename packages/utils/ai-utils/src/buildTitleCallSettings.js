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

// The provider settings that set how much a model reasons. A provider setting wins over the
// call-level `reasoning`, so these have to come off for `reasoning: 'none'` to take effect.
const REASONING_KEYS = {
  anthropic: ['thinking', 'effort'],
  google: ['thinkingConfig'],
  openai: ['reasoningEffort', 'reasoningSummary'],
};

// Room for the reasoning a model does even at `reasoning: 'none'`: some can't turn it off
// (Anthropic's always-thinking models fall back to low effort, Gemini 2.5 Pro to its minimum
// budget, the first gpt-5 to its default), and reasoning tokens count against this cap. A
// model that doesn't reason stops after the few words of the title.
const MAX_OUTPUT_TOKENS = 1024;

// Every other provider setting is kept: besides routing and retention in `gateway`, the provider
// keys carry settings the title call must honour too, such as OpenAI's `store` or Gemini's
// `safetySettings`. A setting left on by mistake costs tokens; one taken off by mistake could
// send the conversation somewhere the agent's own calls don't go.
function buildTitleProviderOptions(providerOptions) {
  if (type.isNone(providerOptions)) return undefined;
  const titleProviderOptions = { ...providerOptions };
  Object.entries(REASONING_KEYS).forEach(([provider, keys]) => {
    if (!type.isObject(titleProviderOptions[provider])) return;
    const options = { ...titleProviderOptions[provider] };
    keys.forEach((key) => delete options[key]);
    titleProviderOptions[provider] = options;
  });
  return titleProviderOptions;
}

// generateText takes only the total and step limits; it ignores the streaming chunk limits
// (and logs an AI SDK warning for them), which would leave the title call unbounded.
function buildTitleTimeout(timeout) {
  if (type.isNone(timeout)) return undefined;
  if (type.isNumber(timeout)) return timeout;
  const { totalMs, stepMs } = timeout;
  if (type.isNone(totalMs) && type.isNone(stepMs)) return undefined;
  return { totalMs, stepMs };
}

function buildTitleCallSettings({ providerOptions, timeout }) {
  return {
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    providerOptions: buildTitleProviderOptions(providerOptions),
    reasoning: 'none',
    timeout: buildTitleTimeout(timeout),
  };
}

export default buildTitleCallSettings;
