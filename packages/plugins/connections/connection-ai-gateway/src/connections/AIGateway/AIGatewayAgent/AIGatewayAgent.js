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
  const gateway = {};
  if (props.order) gateway.order = props.order;
  if (props.only) gateway.only = props.only;
  if (props.fallbackModels) gateway.models = props.fallbackModels;
  if (props.user) gateway.user = props.user;
  if (props.tags) gateway.tags = props.tags;
  if (props.zeroDataRetention !== undefined) gateway.zeroDataRetention = props.zeroDataRetention;
  if (props.providerTimeouts) gateway.providerTimeouts = props.providerTimeouts;
  if (props.byok) gateway.byok = props.byok;

  if (Object.keys(gateway).length > 0) {
    props.providerOptions = {
      ...props.providerOptions,
      gateway: { ...props.providerOptions?.gateway, ...gateway },
    };
  }
  return handleAgentChat({ connection, properties, context });
}

const AIGatewayAgent = { schema, resolver };
export default AIGatewayAgent;
