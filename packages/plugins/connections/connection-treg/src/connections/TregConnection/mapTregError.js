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

import { ConfigError, ServiceError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import readRetryAfter from './readRetryAfter.js';
import redactToken from './redactToken.js';

const MAX_DETAIL_LENGTH = 300;

function formatUsd(micro) {
  if (!type.isNumber(micro)) return '?';
  return `$${Number((micro / 1000000).toFixed(6))}`;
}

// treg answers its own refusals as { detail: string | { error, message, ... } }.
function readDetail(body) {
  if (!type.isObject(body)) return { text: null, info: {} };
  const detail = body.detail ?? body;
  if (type.isString(detail)) return { text: detail, info: body };
  if (type.isObject(detail)) return { text: detail.message ?? detail.error ?? null, info: detail };
  return { text: null, info: body };
}

// A code a caller can branch on: treg's snake_case error names, never free text.
function readCode(info) {
  return type.isString(info.error) && /^[a-z0-9_]{1,64}$/.test(info.error) ? info.error : undefined;
}

function withFields(error, fields) {
  Object.entries(fields).forEach(([key, value]) => {
    if (!type.isUndefined(value)) error[key] = value;
  });
  return error;
}

// Maps a non-2xx answer from /call/ or the catalog to the error the request throws.
//
// - A ServiceError is transient (429, 5xx, a busy idempotency key): retry it, after
//   `retryAfter` seconds when treg said how long.
// - A ConfigError (a 422 from treg) needs a config change.
// - Any other error is final: retrying the same call will fail or cost the same again.
//
// Messages carry treg's own explanations but never a provider's body (treg relays those
// verbatim and they may hold anything), never an auth failure's body, never the token and
// never the team's top-up link, which goes to the server log through the error's cause.
function mapTregError({ response, target, connection }) {
  const { status, headers, body } = response;
  const tregOwn = headers.get('x-treg-error') === '1';
  const { text, info } = readDetail(body);
  const code = readCode(info);
  const detail = type.isString(text)
    ? redactToken({ text, token: connection.token }).slice(0, MAX_DETAIL_LENGTH)
    : null;
  const whose = tregOwn ? 'treg' : 'The provider';

  if (status === 401) {
    return withFields(
      new Error('treg rejected the connection token (401). Check the TregConnection "token".'),
      { statusCode: 401, code: 'unauthorized' }
    );
  }

  if (status === 402) {
    if (code === 'insufficient_balance' || code === 'out_of_balance') {
      const topupUrl = type.isString(info.topup_url)
        ? new URL(info.topup_url, connection.baseUrl ?? 'https://treg.to').href
        : null;
      return withFields(
        new Error(
          `treg balance too low: needs ~${formatUsd(info.estimated_cost_micro)}, has ${formatUsd(
            info.balance_micro
          )}.`,
          {
            cause: new Error(
              `treg balance too low for ${target}. Top up the team balance${
                topupUrl ? ` at ${topupUrl}` : ''
              }, or connect the team's own key for the provider.`
            ),
          }
        ),
        { statusCode: 402, code }
      );
    }
    if (code === 'route_max_cost') {
      return withFields(
        new Error(
          `treg call to ${target} would exceed the maxCost ceiling of ${formatUsd(
            info.max_cost_micro
          )} (estimated ~${formatUsd(info.estimated_cost_micro)}). Nothing was charged.`
        ),
        { statusCode: 402, code }
      );
    }
    return withFields(new Error(`${whose} refused the call to ${target} (402).`), {
      statusCode: 402,
      code,
    });
  }

  if (status === 403) {
    // Auth refusals: the code says which gate refused (tag_blocked, a pin mismatch), and
    // the body is not repeated.
    return withFields(
      new Error(
        `${whose} refused the call to ${target} (403${tregOwn && code ? ` ${code}` : ''}).`
      ),
      { statusCode: 403, code: tregOwn ? code : undefined }
    );
  }

  if (status === 409 && tregOwn) {
    return new ServiceError(
      `An earlier call to ${target} with the same idempotency key is still in flight (409).`,
      {
        service: 'treg',
        statusCode: 409,
        code: code ?? 'idempotency_in_flight',
        retryAfter: readRetryAfter({ headers, detail: info }),
      }
    );
  }

  if (status === 422 && tregOwn) {
    return withFields(
      new ConfigError(`treg rejected the call to ${target} (422)${detail ? `: ${detail}` : '.'}`),
      { statusCode: 422, code }
    );
  }

  if (status === 429) {
    return new ServiceError(
      `${tregOwn ? 'Rate limited' : 'The provider rate limited'} the call to ${target} (429${
        tregOwn && code ? ` ${code}` : ''
      }).`,
      {
        service: 'treg',
        statusCode: 429,
        code: tregOwn ? code : undefined,
        retryAfter: readRetryAfter({ headers, detail: info }),
      }
    );
  }

  if (status === 502 && code === 'response_buffer_limit') {
    // Final, not a ServiceError: the same answer is just as large on a retry. No
    // statusCode either, since a 5xx status would make the API layer treat it as transient.
    return withFields(
      new Error(
        `treg could not deliver the answer of ${target}: it is larger than treg's 8 MiB settlement buffer. Nothing was charged, and the same call will fail again.`
      ),
      { code }
    );
  }

  if (status === 503 && code === 'provider_capacity_unavailable') {
    return new ServiceError(
      `Its own ${
        info.provider ?? 'provider'
      } account is out of capacity, so ${target} can not be served on treg's key right now (503). Nothing was charged.`,
      {
        service: 'treg',
        statusCode: 503,
        code,
        // treg lets one call a minute through as a probe once the account recovers.
        retryAfter: readRetryAfter({ headers, detail: info }) ?? 60,
      }
    );
  }

  if (status === 503 && info.treg_saturated === true) {
    return new ServiceError(`Saturated (503). Nothing was charged for ${target}.`, {
      service: 'treg',
      statusCode: 503,
      code: 'treg_saturated',
      retryAfter: readRetryAfter({ headers, detail: info }),
    });
  }

  if (status >= 500) {
    return new ServiceError(
      `${tregOwn ? 'Answered' : 'The provider answered'} ${status} for ${target}${
        tregOwn && detail ? `: ${detail}` : '.'
      }`,
      {
        service: 'treg',
        statusCode: status,
        code: tregOwn ? code : undefined,
        retryAfter: readRetryAfter({ headers, detail: info }),
      }
    );
  }

  if (status >= 300 && status < 400) {
    return withFields(
      new Error(
        `treg answered a redirect (${status}) for ${target}, which is not followed. Check the TregConnection "baseUrl".`
      ),
      { statusCode: status }
    );
  }

  return withFields(
    new Error(
      `${whose} answered ${status} for ${target}${tregOwn && detail ? `: ${detail}` : '.'}`
    ),
    { statusCode: status, code: tregOwn ? code : undefined }
  );
}

export default mapTregError;
