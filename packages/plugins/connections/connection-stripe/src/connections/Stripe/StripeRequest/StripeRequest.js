/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { get } from '@lowdefy/helpers';
import Stripe from 'stripe';
import schema from './schema.js';

async function StripeRequest({ request, connection }) {
  const stripe = new Stripe(connection.secretKey, {
    apiVersion: connection.apiVersion,
    maxNetworkRetries: connection.maxNetworkRetries,
    timeout: connection.timeout,
    telemetry: connection.telemetry,
  });

  let args = request;
  const path = [];

  do {
    const key = Object.keys(args)[0];

    path.push(key);
    args = args[key];
  } while (args && !Array.isArray(args));

  const resource = get(stripe, path.slice(0, -1).join('.'));
  const method = get(stripe, path.join('.'));

  if (!resource || !method || typeof method !== 'function') {
    throw new Error(`Invalid Stripe method ${path.join('.')}`);
  }

  return method.call(resource, ...(args || []));
}

StripeRequest.schema = schema;
StripeRequest.meta = {
  checkRead: false,
  checkWrite: false,
};

export default StripeRequest;
