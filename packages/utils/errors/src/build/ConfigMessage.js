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

import path from 'path';

import resolveConfigLocation from './resolveConfigLocation.js';

/**
 * Valid check slugs for ~ignoreBuildChecks.
 * Keys are the slug names, values are descriptions for error messages.
 * These suppress BUILD-TIME validation only - runtime errors still occur.
 */
export const VALID_CHECK_SLUGS = {
  'state-refs': 'Undefined _state reference warnings',
  'payload-refs': 'Undefined _payload reference warnings',
  'step-refs': 'Undefined _step reference warnings',
  'link-refs': 'Invalid Link action page reference warnings',
  'request-refs': 'Invalid Request action reference warnings',
  'connection-refs': 'Nonexistent connection ID references',
  types: 'All type validation (blocks, operators, actions, requests, connections)',
  schema: 'JSON schema validation errors',
};

/**
 * Base class for config message utilities.
 * Provides shared utilities for ConfigError and ConfigWarning.
 */
class ConfigMessage {
  /**
   * Checks if a message should be suppressed based on ~ignoreBuildChecks.
   * Walks up the parent chain looking for suppressions that cover this check.
   * This walk happens ONLY when an error/warning is about to be logged.
   *
   * @param {Object} params
   * @param {string} params.configKey - Config key (~k) of the error location
   * @param {Object} params.keyMap - The keyMap from build context
   * @param {string} [params.checkSlug] - The specific check being performed (e.g., 'state-refs')
   * @returns {boolean} True if message should be suppressed
   */
  static shouldSuppress({ configKey, keyMap, checkSlug }) {
    if (!configKey || !keyMap) return false;

    let currentKey = configKey;
    let depth = 0;
    const MAX_DEPTH = 100; // Guard against circular parents

    while (currentKey && depth < MAX_DEPTH) {
      const entry = keyMap[currentKey];
      if (!entry) break;

      const ignoredChecks = entry['~ignoreBuildChecks'];

      if (ignoredChecks === true) {
        return true;
      }

      if (Array.isArray(ignoredChecks) && checkSlug && ignoredChecks.includes(checkSlug)) {
        return true;
      }

      currentKey = entry['~k_parent'];
      depth++;
    }

    return false;
  }

  /**
   * Resolves location from configKey using keyMap and refMap.
   * @param {Object} params
   * @param {string} params.configKey - Config key (~k) for keyMap lookup
   * @param {Object} params.context - Build context with keyMap, refMap, directories
   * @returns {Object|null} Location object { source, config, link } or null
   */
  static resolveLocation({ configKey, context }) {
    if (!configKey || !context?.keyMap) return null;

    return resolveConfigLocation({
      configKey,
      keyMap: context.keyMap,
      refMap: context.refMap,
      configDirectory: context.directories?.config,
    });
  }

  /**
   * Resolves location directly from operatorLocation (ref + line) without keyMap.
   * Used during early build stages (buildRefs) when keyMap doesn't exist yet.
   * @param {Object} params
   * @param {Object} params.operatorLocation - { ref, line }
   * @param {Object} params.context - Build context with refMap, directories
   * @returns {Object|null} Location object { source, link } or null
   */
  static resolveOperatorLocation({ operatorLocation, context }) {
    if (!operatorLocation) return null;

    const refEntry = context?.refMap?.[operatorLocation.ref];
    const filePath = refEntry?.path ?? 'lowdefy.yaml';
    const lineNumber = operatorLocation.line;

    const source = lineNumber ? `${filePath}:${lineNumber}` : filePath;
    let link = null;
    if (context?.directories?.config) {
      link =
        path.join(context.directories.config, filePath) + (lineNumber ? `:${lineNumber}` : '');
    }

    return { source, link };
  }

  /**
   * Resolves location from raw filePath and lineNumber.
   * Used for YAML parse errors and other cases without config context.
   * @param {Object} params
   * @param {string} params.filePath - Direct file path
   * @param {number|string} [params.lineNumber] - Direct line number
   * @param {string} [params.configDirectory] - Config directory for link
   * @returns {Object} Location object { source, link }
   */
  static resolveRawLocation({ filePath, lineNumber, configDirectory }) {
    const source = lineNumber ? `${filePath}:${lineNumber}` : filePath;
    let link = null;
    if (configDirectory) {
      link = path.join(configDirectory, filePath) + (lineNumber ? `:${lineNumber}` : '');
    }

    return { source, link };
  }
}

export default ConfigMessage;
