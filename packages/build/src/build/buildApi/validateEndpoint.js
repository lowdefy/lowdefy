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

import { compile } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';
import { cleanBuildArtifact, type } from '@lowdefy/helpers';

import validateId from '../../utils/validateId.js';
import validateCronExpression from '../../utils/validateCronExpression.js';
import validateRunAs from './validateRunAs.js';

function validateSchedules({ endpoint, configKey }) {
  if (type.isUndefined(endpoint.schedules)) return;
  if (!type.isArray(endpoint.schedules)) {
    throw new ConfigError(`Endpoint schedules is not an array at "${endpoint.id}".`, {
      received: endpoint.schedules,
      configKey,
    });
  }
  const seenCrons = new Set();
  endpoint.schedules.forEach((schedule, scheduleIndex) => {
    if (!type.isObject(schedule)) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex} is not an object at "${endpoint.id}".`,
        { received: schedule, configKey }
      );
    }
    if (!type.isString(schedule.cron)) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex} cron is not a string at "${endpoint.id}".`,
        { received: schedule.cron, configKey }
      );
    }
    const reason = validateCronExpression(schedule.cron);
    if (reason) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex} cron "${schedule.cron}" is invalid at "${endpoint.id}": ${reason}.`,
        { received: schedule.cron, configKey }
      );
    }
    // The x-vercel-cron-schedule header disambiguates which schedule fired at runtime, so an
    // endpoint's cron expressions must be unique.
    if (seenCrons.has(schedule.cron)) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex} has duplicate cron "${schedule.cron}" at "${endpoint.id}".`,
        { received: schedule.cron, configKey }
      );
    }
    seenCrons.add(schedule.cron);
    if (!type.isUndefined(schedule.payload) && !type.isObject(schedule.payload)) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex} payload is not an object at "${endpoint.id}".`,
        { received: schedule.payload, configKey }
      );
    }
  });
}

// A declared schema is compiled once here so an invalid one is a located build
// error, not a runtime throw on the first call that reaches it.
function validateJsonSchema({ checkSlug, endpoint, field, configKey }) {
  const schema = endpoint[field];
  if (type.isNone(schema)) return;
  try {
    compile({ schema: cleanBuildArtifact(schema) });
  } catch (error) {
    throw new ConfigError(
      `Api endpoint "${endpoint.id}" ${field} is not a valid JSON schema: ${error.message}.`,
      { received: schema, configKey, checkSlug }
    );
  }
}

function validateEndpoint({ endpoint, index, checkDuplicateEndpointId }) {
  const configKey = endpoint['~k'];
  if (type.isUndefined(endpoint.id)) {
    throw new ConfigError(`Endpoint id missing at endpoint ${index}.`, { configKey });
  }
  if (!type.isString(endpoint.id)) {
    throw new ConfigError(`Endpoint id is not a string at endpoint ${index}.`, {
      received: endpoint.id,
      configKey,
    });
  }
  validateId({ id: endpoint.id, field: 'Endpoint id', configKey });
  if (type.isUndefined(endpoint.type)) {
    throw new ConfigError(`Endpoint type is not defined at "${endpoint.id}".`, { configKey });
  }
  if (!type.isString(endpoint.type)) {
    throw new ConfigError(`Endpoint type is not a string at "${endpoint.id}".`, {
      received: endpoint.type,
      configKey,
    });
  }
  const validEndpointTypes = ['Api', 'InternalApi'];
  if (!validEndpointTypes.includes(endpoint.type)) {
    throw new ConfigError(
      `Endpoint type "${endpoint.type}" is not valid at "${
        endpoint.id
      }". Must be one of: ${validEndpointTypes.join(', ')}.`,
      { received: endpoint.type, configKey }
    );
  }
  checkDuplicateEndpointId({ id: endpoint.id, configKey });
  // A webhook routine's payload is the transport envelope { body, query, headers },
  // never the payloadSchema shape, so the two together can only be a mistake -
  // and silently skipping validation is the failure mode payloadSchema removes.
  const isWebhook = !type.isNone(endpoint.webhook) && endpoint.webhook !== false;
  if (isWebhook && !type.isNone(endpoint.payloadSchema)) {
    throw new ConfigError(
      `Endpoint "${endpoint.id}" declares both "webhook" and "payloadSchema". A webhook routine receives { body, query, headers }, not the payloadSchema shape. Validate the body with a ValidateSchema step instead.`,
      { configKey }
    );
  }
  validateSchedules({ endpoint, configKey });
  validateJsonSchema({ checkSlug: 'payload-schema', endpoint, field: 'payloadSchema', configKey });
  validateJsonSchema({
    checkSlug: 'response-schema',
    endpoint,
    field: 'responseSchema',
    configKey,
  });
  validateRunAs({ runAs: endpoint.runAs, location: `Api endpoint "${endpoint.id}"`, configKey });
}

export default validateEndpoint;
