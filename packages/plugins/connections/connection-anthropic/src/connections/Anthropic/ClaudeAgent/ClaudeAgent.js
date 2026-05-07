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

async function resolver({ connection, properties, context, format }) {
  const props = properties.agent.properties;
  const anthropic = {};
  if (props.thinking) anthropic.thinking = props.thinking;
  if (props.effort) anthropic.effort = props.effort;

  if (Object.keys(anthropic).length > 0) {
    props.providerOptions = {
      ...props.providerOptions,
      anthropic: { ...props.providerOptions?.anthropic, ...anthropic },
    };
  }
  return handleAgentChat({ connection, properties, context, format });
}

const ClaudeAgent = { schema, resolver };
export default ClaudeAgent;
