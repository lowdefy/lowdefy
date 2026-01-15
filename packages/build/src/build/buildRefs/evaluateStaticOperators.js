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

import { serializer, type } from '@lowdefy/helpers';
import { BuildParser } from '@lowdefy/operators';
import collectConfigError from '../../utils/collectConfigError.js';

async function evaluateStaticOperators({ components, context }) {
  // Build dynamic operator registry for O(1) lookups
  const dynamicOperators = new Set();
  const dynamicMethods = new Map();

  // Load operators from context.typesMap
  const operators = {};
  const operatorTypes = context.typesMap.operators ?? {};

  await Promise.all(
    Object.keys(operatorTypes).map(async (opName) => {
      const operatorModule = operatorTypes[opName];
      if (operatorModule && operatorModule.modulePath) {
        try {
          const module = await import(operatorModule.modulePath);
          const operatorFn = module.default;
          operators[opName] = operatorFn;

          // Build dynamic operator registry
          if (operatorFn.dynamic === true) {
            dynamicOperators.add(opName);
          }

          if (operatorFn.meta) {
            Object.keys(operatorFn.meta).forEach((methodName) => {
              if (operatorFn.meta[methodName].dynamic === true) {
                const key = `${opName}.${methodName}`;
                dynamicMethods.set(key, true);
              }
            });
          }
        } catch (error) {
          collectConfigError({
            message: `Failed to load operator ${opName}: ${error.message}`,
            context,
          });
        }
      }
    })
  );

  // Quick scan optimization - check if value contains any operators
  function hasAnyOperators(value, operatorPrefix = '_') {
    if (type.isArray(value)) {
      return value.some((item) => hasAnyOperators(item, operatorPrefix));
    }
    if (type.isObject(value)) {
      const keys = Object.keys(value);
      if (keys.length === 1 && keys[0].startsWith(operatorPrefix)) {
        return true;
      }
      return keys.some((key) => hasAnyOperators(value[key], operatorPrefix));
    }
    return false;
  }

  // Check if operator is dynamic using Set lookup
  function hasDynamicOperator(opKey) {
    const [op, methodName] = opKey.split('.');
    if (methodName) {
      return dynamicMethods.has(opKey);
    }
    return dynamicOperators.has(op);
  }

  // Perform partial evaluation
  function evaluateValue(value, location, operatorPrefix = '_') {
    if (type.isArray(value)) {
      return value.map((item, index) => evaluateValue(item, `${location}[${index}]`, operatorPrefix));
    }

    if (type.isObject(value)) {
      const keys = Object.keys(value);

      // Check if this is an operator object (single key starting with prefix)
      if (keys.length === 1 && keys[0].startsWith(operatorPrefix)) {
        const key = keys[0];
        const opKey = `_${key.substring(operatorPrefix.length)}`;

        // If dynamic operator, stop evaluation and return as-is
        if (hasDynamicOperator(opKey)) {
          return value;
        }

        // Static operator - evaluate it
        const parser = new BuildParser({
          env: process.env,
          operators,
        });

        const { output, errors } = parser.parse({
          input: value,
          location,
          operatorPrefix,
        });

        if (errors.length > 0) {
          errors.forEach((error) => {
            collectConfigError({
              message: `Static operator evaluation error at ${location}: ${error.message}`,
              context,
            });
          });
          return value;
        }

        return output;
      }

      // Regular object - evaluate each property independently
      const result = {};
      keys.forEach((key) => {
        result[key] = evaluateValue(value[key], `${location}.${key}`, operatorPrefix);
      });
      return result;
    }

    return value;
  }

  // Evaluate static operators in parallel for pages, requests, connections, API
  await Promise.all([
    // Pages
    Promise.resolve().then(() => {
      if (!components.pages) return;
      components.pages = components.pages.map((page) => {
        if (!hasAnyOperators(page)) return page;
        return evaluateValue(page, `page.${page.id ?? 'unknown'}`);
      });
    }),

    // Requests
    Promise.resolve().then(() => {
      if (!components.requests) return;
      components.requests = components.requests.map((request) => {
        if (!hasAnyOperators(request)) return request;
        return evaluateValue(request, `request.${request.id ?? 'unknown'}`);
      });
    }),

    // Connections
    Promise.resolve().then(() => {
      if (!components.connections) return;
      components.connections = components.connections.map((connection) => {
        if (!hasAnyOperators(connection)) return connection;
        return evaluateValue(connection, `connection.${connection.id ?? 'unknown'}`);
      });
    }),

    // API
    Promise.resolve().then(() => {
      if (!components.api) return;
      components.api = components.api.map((endpoint) => {
        if (!hasAnyOperators(endpoint)) return endpoint;
        return evaluateValue(endpoint, `api.${endpoint.id ?? 'unknown'}`);
      });
    }),
  ]);

  return components;
}

export default evaluateStaticOperators;
