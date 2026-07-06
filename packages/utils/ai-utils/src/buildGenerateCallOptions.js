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

const callSettings = [
  'system',
  'maxOutputTokens',
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
  callSettings.forEach((setting) => {
    if (!type.isNone(request[setting])) {
      options[setting] = request[setting];
    }
  });
  return options;
}

export default buildGenerateCallOptions;
