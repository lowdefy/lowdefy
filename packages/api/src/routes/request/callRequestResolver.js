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

import { RequestError } from '../../context/errors.js';

// Network error codes that indicate external service issues (not config errors)
const NETWORK_ERROR_CODES = [
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNABORTED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_TLS_CERT_ALTNAME_INVALID',
];

// Check if error is a service error (external service issue, not config)
function isServiceError(error) {
  const code = error.code;
  const message = error.message || '';

  // Network errors are always service errors
  if (code && NETWORK_ERROR_CODES.includes(code)) {
    return true;
  }

  // Socket hang up is a service error
  if (message === 'socket hang up') {
    return true;
  }

  // HTTP 5xx errors from external services are service errors
  // AxiosHttp formats these as: 'Http response "5xx: ...'
  if (/Http response "5\d{2}:/.test(message)) {
    return true;
  }

  // Connection/server unavailable errors
  if (/server (is )?(down|unavailable|not responding)/i.test(message)) {
    return true;
  }

  return false;
}

// Enhance network error messages for better debugging
function enhanceErrorMessage(error) {
  const code = error.code;
  const message = error.message;

  if (code === 'ECONNREFUSED') {
    return `Connection refused. The server may be down or not accepting connections. (${code}: ${message})`;
  }
  if (code === 'ENOTFOUND') {
    return `DNS lookup failed. The hostname could not be resolved. (${code}: ${message})`;
  }
  if (code === 'ETIMEDOUT' || code === 'ECONNABORTED') {
    return `Request timed out. The server took too long to respond. (${code}: ${message})`;
  }
  if (code === 'ECONNRESET' || message === 'socket hang up') {
    return `Connection reset. The server closed the connection unexpectedly. (${
      code || 'socket hang up'
    }: ${message})`;
  }
  if (code === 'EHOSTUNREACH' || code === 'ENETUNREACH') {
    return `Host unreachable. Check network connectivity. (${code}: ${message})`;
  }
  if (
    code === 'CERT_HAS_EXPIRED' ||
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
    code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
    code === 'ERR_TLS_CERT_ALTNAME_INVALID'
  ) {
    return `SSL/TLS certificate error. (${code}: ${message})`;
  }

  return message;
}

async function callRequestResolver(
  { blockId, endpointId, logger, pageId, payload },
  { connectionProperties, requestConfig, requestProperties, requestResolver }
) {
  try {
    const response = await requestResolver({
      blockId,
      endpointId,
      connection: connectionProperties,
      connectionId: requestConfig.connectionId,
      pageId,
      payload,
      request: requestProperties,
      requestId: requestConfig.requestId,
    });
    return response;
  } catch (error) {
    const enhancedMessage = enhanceErrorMessage(error);
    const err = new RequestError(enhancedMessage);

    // Classify error type
    err.isServiceError = isServiceError(error);

    // Only attach configKey for config errors (not service errors)
    if (!err.isServiceError) {
      err.configKey = requestConfig['~k'];
    }

    logger.debug(
      { params: { id: requestConfig.requestId, type: requestConfig.type }, err },
      err.message
    );
    throw err;
  }
}

export default callRequestResolver;
