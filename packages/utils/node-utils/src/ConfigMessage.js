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
 * Base class for config message formatting.
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
   * Resolves location directly from operatorLocation (ref + line) without keyMap.
   * Used during early build stages (buildRefs) when keyMap doesn't exist yet.
   * @private
   */
  static _resolveOperatorLocation({ operatorLocation, refMap, configDirectory }) {
    const refEntry = refMap?.[operatorLocation.ref];
    const filePath = refEntry?.path ?? 'lowdefy.yaml';
    const lineNumber = operatorLocation.line;

    const source = lineNumber ? `${filePath}:${lineNumber}` : filePath;
    let link = '';
    if (configDirectory) {
      link = path.join(configDirectory, filePath) + (lineNumber ? `:${lineNumber}` : '');
    }

    return { source, link };
  }

  /**
   * Resolves location from raw filePath and lineNumber.
   * Used for YAML parse errors and other cases without config context.
   * @private
   */
  static _resolveRawLocation({ filePath, lineNumber, configDirectory }) {
    const source = lineNumber ? `${filePath}:${lineNumber}` : filePath;
    let link = '';
    if (configDirectory) {
      link = path.join(configDirectory, filePath) + (lineNumber ? `:${lineNumber}` : '');
    }

    return { source, link };
  }

  /**
   * Core formatting method for config messages.
   *
   * Supports three modes:
   * 1. configKey mode: Uses keyMap to resolve location (standard case after addKeys)
   * 2. operatorLocation mode: Uses refMap directly (early build stages like buildRefs)
   * 3. Raw mode: Uses filePath/lineNumber directly (YAML parse errors)
   *
   * @param {Object} params
   * @param {string} params.prefix - Message prefix like '[Config Error]' or '[Config Warning]'
   * @param {string} params.message - The error/warning message
   * @param {string} [params.configKey] - Config key (~k) for keyMap lookup
   * @param {Object} [params.operatorLocation] - { ref, line } for direct refMap lookup
   * @param {string} [params.filePath] - Direct file path (for raw mode)
   * @param {number|string} [params.lineNumber] - Direct line number (for raw mode)
   * @param {Object} [params.context] - Build context with keyMap, refMap, directories
   * @param {string} [params.configDirectory] - Config directory (for raw mode without context)
   * @param {string} [params.checkSlug] - The specific check being performed (e.g., 'state-refs')
   * @returns {string} Formatted message or empty string if suppressed
   */
  static format({
    prefix,
    message,
    configKey,
    operatorLocation,
    filePath,
    lineNumber,
    context,
    configDirectory,
    checkSlug,
  }) {
    // Check for ~ignoreBuildChecks suppression
    if (ConfigMessage.shouldSuppress({ configKey, keyMap: context?.keyMap, checkSlug })) {
      return '';
    }

    let location = null;
    const configDir = configDirectory ?? context?.directories?.config;

    if (configKey && context?.keyMap) {
      // Mode 1: Use configKey -> keyMap -> refMap path (standard case after addKeys)
      location = resolveConfigLocation({
        configKey,
        keyMap: context.keyMap,
        refMap: context.refMap,
        configDirectory: configDir,
      });
    } else if (operatorLocation && context?.refMap) {
      // Mode 2: Use operatorLocation directly with refMap (early build stages)
      location = ConfigMessage._resolveOperatorLocation({
        operatorLocation,
        refMap: context.refMap,
        configDirectory: configDir,
      });
    } else if (filePath) {
      // Mode 3: Use raw filePath/lineNumber (YAML parse errors, etc.)
      location = ConfigMessage._resolveRawLocation({
        filePath,
        lineNumber,
        configDirectory: configDir,
      });
    }

    if (!location) {
      return `${prefix} ${message}`;
    }

    return `${location.source}\n${prefix} ${message}`;
  }
}

export default ConfigMessage;
