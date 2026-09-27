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

// maxOutputTokens is a limit with a connection default, so buildCallLimits sets it.
const callSettings = [
  'temperature',
  'topP',
  'topK',
  'frequencyPenalty',
  'presencePenalty',
  'seed',
  'stopSequences',
  'maxRetries',
  'providerOptions',
];

function buildGenerateCallOptions({ request }) {
  if (type.isNone(request.prompt) && type.isNone(request.messages)) {
    throw new Error('Either "prompt" or "messages" must be provided.');
  }
  if (!type.isNone(request.prompt) && !type.isNone(request.messages)) {
    throw new Error('Only one of "prompt" or "messages" may be provided, not both.');
  }
  const options = {};
  if (!type.isNone(request.prompt)) {
    options.prompt = request.prompt;
  }
  if (!type.isNone(request.messages)) {
    options.messages = request.messages;
  }
  // A system turn instructs the model as the app itself, and `messages` is
  // often built from a user's input (`_payload`, `_state`), so ai v7 rejects
  // one unless the call opts in. The request opts in explicitly.
  if (request.allowSystemInMessages === true) {
    options.allowSystemInMessages = true;
  } else if ((request.messages ?? []).some((message) => message?.role === 'system')) {
    throw new Error(
      '"messages" includes a system message. Use the "system" property for the system prompt, or set "allowSystemInMessages: true" if the system message comes from the app, never from a user.'
    );
  }
  // `system` is the request's public property; ai v7 calls it `instructions`.
  if (!type.isNone(request.system)) {
    options.instructions = request.system;
  }
  callSettings.forEach((setting) => {
    if (!type.isNone(request[setting])) {
      options[setting] = request[setting];
    }
  });
  return options;
}

export default buildGenerateCallOptions;
