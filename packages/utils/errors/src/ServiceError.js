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

import findInErrorChain from './findInErrorChain.js';
import hasTimeoutInChain from './hasTimeoutInChain.js';
import isTimeoutError from './isTimeoutError.js';

/**
 * Network error codes that indicate service issues (not config problems).
 */
const SERVICE_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNABORTED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'EAI_AGAIN',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
]);

// The HTTP status an error carries, in the places client libraries put it: most HTTP
// clients use `statusCode`, `status` or `response.status`, AWS SDK v3 uses
// `$metadata.httpStatusCode`, and @google-cloud and SendGrid use a numeric `code`. A
// numeric `code` outside the HTTP range is a driver's own code (MongoDB), not a status.
function readHttpStatus(error) {
  if (!error || typeof error !== 'object') return undefined;
  const numericCode =
    Number.isInteger(error.code) && error.code >= 100 && error.code < 600 ? error.code : undefined;
  return (
    error.statusCode ??
    error.status ??
    error.response?.status ??
    error.$metadata?.httpStatusCode ??
    numericCode
  );
}

// What failed, read once from the error and its chain. A call that ran out of time got no
// answer, so any status attached above the cancellation is one a client made up, not a
// server response: the AI gateway client reports 500 for an AbortSignal.timeout, and 408
// for an undici timeout. A real 5xx or 429 wrapped around a timeout looks the same, so the
// timeout wins.
function classifyFailure(error) {
  if (hasTimeoutInChain(error)) {
    return { timedOut: true, statusCode: undefined };
  }
  return { timedOut: false, statusCode: findInErrorChain(error, readHttpStatus) };
}

// 5xx is a failing service; 429 is a service throttling its callers. Both pass with
// time, and neither is fixed by changing config.
function isServiceStatus(statusCode) {
  return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
}

// Retry-After from response headers, which clients expose as a plain object (the AI
// SDK's responseHeaders, axios and SendGrid response.headers, Stripe headers) or as a
// fetch Headers instance.
function readRetryAfterHeader(headers) {
  if (!headers || typeof headers !== 'object') return undefined;
  if (typeof headers.get === 'function') {
    return headers.get('retry-after') ?? undefined;
  }
  return headers['retry-after'] ?? headers['Retry-After'];
}

/**
 * Error class for external service failures (network, timeout, database, 5xx, 429).
 *
 * ServiceError represents infrastructure/service issues that are NOT caused by
 * invalid configuration. The config location is still resolved to help developers
 * identify which request/connection triggered the service failure.
 *
 * The message is formatted in the constructor - no format() method needed.
 *
 * @example
 * // In request handler:
 * try {
 *   return await fetch(url);
 * } catch (error) {
 *   if (ServiceError.isServiceError(error)) {
 *     throw new ServiceError(undefined, { cause: error, service: 'MongoDB' });
 *   }
 *   throw new PluginError(error.message, { cause: error, ... });
 * }
 * // error.message = "MongoDB: Connection refused. The service may be down..."
 */
class ServiceError extends Error {
  /**
   * Creates a ServiceError instance with formatted message.
   * @param {string} [message] - Error message (falls back to enhanced cause message)
   * @param {Object} [options]
   * @param {Error} [options.cause] - Original error to wrap (auto-enhances message)
   * @param {string} [options.service] - Name of the service that failed
   * @param {string} [options.code] - Error code (e.g., 'ECONNREFUSED')
   * @param {number} [options.statusCode] - HTTP status code if applicable
   * @param {string} [options.configKey] - Config key for location resolution
   * @param {string} [options.hint] - A sentence telling the developer what to do about the
   *   failure. Enumerable, so it survives serialization to the client.
   * @param {string} [options.retryAfter] - The Retry-After a throttling service sent
   *   (seconds or an HTTP date). Read from the cause when not given.
   */
  constructor(message, { cause, service, code, statusCode, configKey, hint, retryAfter } = {}) {
    // Extract info from wrapped error if provided
    const errorCode = code ?? cause?.code;
    // A status passed in is the caller saying a service answered with it.
    const failure =
      statusCode === undefined || statusCode === null
        ? classifyFailure(cause)
        : { timedOut: false, statusCode };

    // Use provided message, or enhance wrapped error's message
    const baseMessage =
      message ?? (cause ? ServiceError.enhanceMessage(cause, failure) : 'Service error');

    // Message without prefix - logger uses error.name for display
    // Include service in message if provided
    const formattedMessage = service ? `${service}: ${baseMessage}` : baseMessage;

    super(formattedMessage, { cause });
    this.name = 'ServiceError';
    this.isLowdefyError = true;
    this._message = baseMessage;
    this.service = service;
    this.code = errorCode;
    this.hint = hint ?? cause?.hint ?? null;
    this.statusCode = failure.statusCode;
    this.retryAfter = retryAfter ?? ServiceError.readRetryAfter(cause);
    // Extract from the wrapped error like PluginError does, so a ServiceError
    // wrapped around an error that already resolved its config location keeps it.
    this.configKey = configKey ?? cause?.configKey ?? null;
  }

  /**
   * Checks if an error is a service error (network issues, timeouts, 5xx, rate limits).
   * @param {Error} error - The error to check
   * @param {Set} [seen] - Errors already checked, so a cyclic cause chain ends
   * @returns {boolean} True if this is a service error
   */
  static isServiceError(error, seen = new Set()) {
    if (!error || seen.has(error)) return false;
    seen.add(error);

    // A connection that has already classified its error as the service refusing the request
    // (a duplicate key, an invalid query) says so. The message checks below would otherwise
    // match words in a collection name or in the document values a driver message quotes.
    if (error.isServiceError === false) return false;

    // A client that retried and gave up (the AI SDK's RetryError) carries the
    // failure it retried on; its own message and fields hold no status.
    if (error.lastError) {
      return ServiceError.isServiceError(error.lastError, seen);
    }

    // Check error code
    if (error.code && SERVICE_ERROR_CODES.has(error.code)) {
      return true;
    }

    // A call cancelled because it ran out of time (AbortSignal.timeout, the AI SDK's
    // timeout option, the server's request timeout, undici's timeouts).
    if (isTimeoutError(error)) {
      return true;
    }

    // AWS SDK v3 marks throttling exceptions as retryable throttling; some services
    // answer them with 400 rather than 429.
    if (error.$retryable?.throttling === true) {
      return true;
    }

    if (isServiceStatus(readHttpStatus(error))) {
      return true;
    }

    // Check for common service error messages
    const message = error.message?.toLowerCase() ?? '';
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('too many requests') ||
      message.includes('connection refused') ||
      message.includes('dns lookup failed') ||
      message.includes('socket hang up') ||
      message.includes('certificate') ||
      message.includes('unavailable')
    ) {
      return true;
    }

    // A client error that wraps the network failure underneath it (the AI
    // SDK's "Cannot connect to API" around a refused or timed-out fetch).
    return ServiceError.isServiceError(error.cause, seen);
  }

  /**
   * Enhances an error message with more helpful context.
   * @param {Error} error - The original error
   * @param {Object} [failure] - Whether the call timed out and the status it failed with,
   *   when the caller already worked them out
   * @returns {string} Enhanced error message
   */
  static enhanceMessage(error, failure = classifyFailure(error)) {
    const code = error.code;
    const { timedOut, statusCode } = failure;

    if (code === 'ECONNREFUSED') {
      return `Connection refused. The service may be down or the address may be incorrect. ${
        error.message ?? ''
      }`;
    }
    if (code === 'ENOTFOUND') {
      return `DNS lookup failed. The hostname could not be resolved. ${error.message ?? ''}`;
    }
    if (code === 'ETIMEDOUT') {
      return `Connection timed out. The service may be slow or unreachable. ${error.message ?? ''}`;
    }
    if (code === 'ECONNRESET') {
      return `Connection reset by the server. ${error.message ?? ''}`;
    }
    if (timedOut) {
      return `Request timed out. The service may be slow, or the timeout too short. ${
        error.message ?? ''
      }`;
    }
    if (statusCode === 429) {
      const retryAfter = ServiceError.readRetryAfter(error);
      const retry = retryAfter ? ` Retry after ${retryAfter}.` : '';
      return `Rate limited by the service (429 Too Many Requests).${retry} ${error.message ?? ''}`;
    }
    if (statusCode && statusCode >= 500) {
      return `Server returned error ${statusCode}. ${error.message ?? ''}`;
    }

    return error.message;
  }

  /**
   * Reads the Retry-After header a throttling service sent, from the error, the
   * failure a retrying client gave up on, or its cause chain.
   * @param {Error} error - The error to read
   * @returns {string|null} The header value (seconds or an HTTP date), or null
   */
  static readRetryAfter(error) {
    const retryAfter = findInErrorChain(
      error,
      (node) =>
        readRetryAfterHeader(node.responseHeaders) ??
        readRetryAfterHeader(node.response?.headers) ??
        readRetryAfterHeader(node.headers) ??
        readRetryAfterHeader(node.$response?.headers) ??
        undefined
    );
    return retryAfter === undefined ? null : String(retryAfter);
  }
}

export default ServiceError;
