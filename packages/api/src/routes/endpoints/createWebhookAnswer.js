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

import { serializer } from '@lowdefy/helpers';

import redactResponse from '../../response/redactResponse.js';

// The route sends a webhook's answer to a third party, not the Lowdefy client, as plain JSON: a
// date arrives as an ISO string, not the serializer's { "~d": ... } form, and no build marker
// crosses.
function toPlainJson(context, value) {
  return serializer.deserialize(redactResponse(context, value));
}

function errorBody({ code, message }) {
  return { error: { code, message } };
}

// The HTTP status and body a webhook route answers with, from the routine's outcome. A :reject
// answers the :status and :body it set (400 and an error body by default), also when it was
// raised in an endpoint the routine called. A failed ValidateSchema step answers 400. Any other
// failure answers 500 with a fixed message, so nothing from the error reaches the caller.
function createWebhookAnswer(context, { error, response, status }) {
  if (status === 'reject') {
    return {
      status: error.webhookStatus ?? 400,
      body: Object.hasOwn(error, 'webhookBody')
        ? toPlainJson(context, error.webhookBody)
        : errorBody({ code: 'rejected', message: error.message }),
    };
  }
  if (status === 'error' && error?.isInvalidRequest === true) {
    return {
      status: 400,
      body: errorBody({ code: 'invalid_request', message: error.message }),
    };
  }
  if (status === 'error') {
    return {
      status: 500,
      body: errorBody({ code: 'internal_error', message: 'Webhook failed.' }),
    };
  }
  return { status: 200, body: toPlainJson(context, response) ?? { ok: true } };
}

export default createWebhookAnswer;
