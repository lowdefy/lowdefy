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

import { handleAgentChat } from '@lowdefy/ai-utils';
import schema from './schema.js';

async function resolver({ connection, properties, context }) {
  const props = properties.agent.properties;
  const google = {};
  if (props.thinkingConfig) google.thinkingConfig = props.thinkingConfig;
  if (props.safetySettings) google.safetySettings = props.safetySettings;

  if (Object.keys(google).length > 0) {
    props.providerOptions = {
      ...props.providerOptions,
      google: { ...props.providerOptions?.google, ...google },
    };
  }
  return handleAgentChat({ connection, properties, context });
}

const GeminiAgent = { schema, resolver };
export default GeminiAgent;
