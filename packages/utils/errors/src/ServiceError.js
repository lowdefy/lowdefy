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

/**
 * Error class for external service failures (network, timeout, database, 5xx).
 *
 * ServiceError represents infrastructure/service issues that are NOT caused by
 * invalid configuration. These errors should not include config location info
 * since the config is correct - the external service is the problem.
 *
 * The message is formatted in the constructor - no format() method needed.
 *
 * @example
 * // In request handler:
 * try {
 *   return await fetch(url);
 * } catch (error) {
 *   if (ServiceError.isServiceError(error)) {
 *     throw ServiceError.from(error, 'MongoDB');
 *   }
 *   throw PluginError.from({ error, ... });
 * }
 * // error.message = "[Service Error] MongoDB: Connection refused. The service may be down..."
 */
class ServiceError extends Error {
  /**
   * Creates a ServiceError instance with formatted message.
   * @param {Object} params
   * @param {string} params.message - The error message
   * @param {string} [params.service] - Name of the service that failed
   * @param {string} [params.code] - Error code (e.g., 'ECONNREFUSED')
   * @param {number} [params.statusCode] - HTTP status code if applicable
   * @param {Error} [params.cause] - The original error
   */
  constructor({ message, service, code, statusCode, cause }) {
    // Format the message with service name
    const formattedMessage = service
      ? `[Service Error] ${service}: ${message}`
      : `[Service Error] ${message}`;

    super(formattedMessage, { cause });
    this.name = 'ServiceError';
    this.rawMessage = message;
    this.service = service;
    this.code = code;
    this.statusCode = statusCode;
    this.configKey = null;

    if (cause?.stack) {
      this.stack = cause.stack;
    }
  }

  /**
   * Checks if an error is a service error (network issues, timeouts, 5xx).
   * @param {Error} error - The error to check
   * @returns {boolean} True if this is a service error
   */
  static isServiceError(error) {
    if (!error) return false;

    // Check error code
    if (error.code && SERVICE_ERROR_CODES.has(error.code)) {
      return true;
    }

    // Check HTTP status codes (5xx = server error)
    const statusCode = error.statusCode ?? error.status ?? error.response?.status;
    if (statusCode && statusCode >= 500 && statusCode < 600) {
      return true;
    }

    // Check for common service error messages
    const message = error.message?.toLowerCase() ?? '';
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection refused') ||
      message.includes('dns lookup failed') ||
      message.includes('socket hang up') ||
      message.includes('certificate') ||
      message.includes('unavailable')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Creates a ServiceError from an existing error with enhanced message.
   * @param {Error} error - The original error
   * @param {string} [service] - Name of the service that failed
   * @param {string} [configKey] - Config key for location resolution
   * @returns {ServiceError}
   */
  static from(error, service, configKey) {
    const enhancedMessage = ServiceError.enhanceMessage(error);
    const serviceError = new ServiceError({
      message: enhancedMessage,
      service,
      code: error.code,
      statusCode: error.statusCode ?? error.status ?? error.response?.status,
      cause: error,
    });
    if (configKey) {
      serviceError.configKey = configKey;
    }
    return serviceError;
  }

  /**
   * Enhances an error message with more helpful context.
   * @param {Error} error - The original error
   * @returns {string} Enhanced error message
   */
  static enhanceMessage(error) {
    const code = error.code;
    const statusCode = error.statusCode ?? error.status ?? error.response?.status;

    if (code === 'ECONNREFUSED') {
      return `Connection refused. The service may be down or the address may be incorrect. ${error.message}`;
    }
    if (code === 'ENOTFOUND') {
      return `DNS lookup failed. The hostname could not be resolved. ${error.message}`;
    }
    if (code === 'ETIMEDOUT') {
      return `Connection timed out. The service may be slow or unreachable. ${error.message}`;
    }
    if (code === 'ECONNRESET') {
      return `Connection reset by the server. ${error.message}`;
    }
    if (statusCode && statusCode >= 500) {
      return `Server returned error ${statusCode}. ${error.message}`;
    }

    return error.message;
  }
}

export default ServiceError;
