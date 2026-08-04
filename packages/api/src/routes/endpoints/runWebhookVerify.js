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

import { AuthenticationError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import callRequestResolver from '../request/callRequestResolver.js';
import evaluateRequestOperators from '../request/evaluateOperators.js';
import getConnection from '../connections/getConnection.js';
import getConnectionConfig from '../connections/getConnectionConfig.js';
import getRequestResolver from '../request/getRequestResolver.js';
import resolveTenant from '../request/resolveTenant.js';

// Runs the endpoint's declared `webhook.verify` request plugin as a gate,
// against the RAW request (body, query, headers), before the routine body
// (Decision 3). The verifier is a request plugin - the same class of code as a
// connection request - resolved and invoked through the request-plugin
// machinery, never as a routine step. It reads the request and reports a
// verdict; the RUNNER (not routine or resolver code) performs the trust
// transition, so there is no trust-writing capability on the resolver surface.
//
// Returns true only when the verifier passes: it must not throw and must return
// `true` or `{ verified: true }`. A verifier that throws (e.g. a bad signature)
// is a failed gate, not a server fault - it fails closed to a false verdict.
// Config-resolution errors (missing connection / unknown request type) throw:
// a misconfigured verifier breaks loudly in development rather than silently
// trusting or silently failing.
async function runWebhookVerify(context, { verify, body, query, headers }) {
  const payload = { body: body ?? null, query: query ?? {}, headers: headers ?? {} };

  const connectionConfig = await getConnectionConfig(context, {
    connectionId: verify.connectionId,
    configKey: verify['~k'],
  });
  const connection = getConnection(context, { connectionConfig });

  const requestConfig = {
    type: verify.type,
    connectionId: verify.connectionId,
    requestId: 'webhook.verify',
    properties: verify.properties ?? {},
    // Webhooks run in system context, so a verifier on a tenant connection
    // fails closed (caught at resolveTenant below, verdict false) unless the
    // verify config opts out with tenant: none.
    tenant: verify.tenant,
    '~k': verify['~k'],
  };
  const requestResolver = getRequestResolver(context, { connection, requestConfig });
  let tenant;
  try {
    tenant = resolveTenant(context, { connection, connectionConfig, requestConfig });
  } catch (error) {
    // Only the org-less-caller refusal is a gate outcome - it must not reach
    // the unauthenticated webhook sender as an error body. Config errors
    // (tenant declared on a type without the contract) still throw: a
    // misconfigured verifier breaks loudly, per the contract above.
    if (!(error instanceof AuthenticationError)) {
      throw error;
    }
    context.logger.debug({ event: 'debug_webhook_verify_error', err: error }, error.message);
    return false;
  }

  const { connectionProperties, requestProperties } = evaluateRequestOperators(context, {
    connectionConfig,
    payload,
    requestConfig,
    state: {},
    steps: {},
  });

  try {
    const response = await callRequestResolver(context, {
      connectionProperties,
      endpointDepth: 0,
      requestConfig,
      requestProperties,
      requestResolver,
      tenant,
    });
    return response === true || (type.isObject(response) && response.verified === true);
  } catch (error) {
    context.logger.debug({ event: 'debug_webhook_verify_error', err: error }, error.message);
    return false;
  }
}

export default runWebhookVerify;
