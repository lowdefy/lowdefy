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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import validateId from '../../utils/validateId.js';
import validateCronExpression from '../../utils/validateCronExpression.js';
import getCronEnvironmentNames from '../../utils/getCronEnvironmentNames.js';

// `where` names the schedules list in messages: "" for the endpoint's own schedules, or
// ` for environment "staging"` for an override.
function validateSchedules({ schedules, endpoint, configKey, where = '' }) {
  if (type.isUndefined(schedules)) return;
  if (!type.isArray(schedules)) {
    throw new ConfigError(
      `Endpoint schedules${where} is not an array${
        where ? '' : ' or an object keyed by environment'
      } at "${endpoint.id}".`,
      { received: schedules, configKey }
    );
  }
  const seenCrons = new Set();
  schedules.forEach((schedule, scheduleIndex) => {
    if (!type.isObject(schedule)) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex}${where} is not an object at "${endpoint.id}".`,
        { received: schedule, configKey }
      );
    }
    if (!type.isString(schedule.cron)) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex}${where} cron is not a string at "${endpoint.id}".`,
        { received: schedule.cron, configKey }
      );
    }
    const reason = validateCronExpression(schedule.cron);
    if (reason) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex}${where} cron "${schedule.cron}" is invalid at "${endpoint.id}": ${reason}.`,
        { received: schedule.cron, configKey }
      );
    }
    // The x-vercel-cron-schedule header disambiguates which schedule fired at runtime, so an
    // endpoint's cron expressions must be unique within one environment.
    if (seenCrons.has(schedule.cron)) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex}${where} has duplicate cron "${schedule.cron}" at "${endpoint.id}".`,
        { received: schedule.cron, configKey }
      );
    }
    seenCrons.add(schedule.cron);
    if (!type.isUndefined(schedule.payload) && !type.isObject(schedule.payload)) {
      throw new ConfigError(
        `Endpoint schedule ${scheduleIndex}${where} payload is not an object at "${endpoint.id}".`,
        { received: schedule.payload, configKey }
      );
    }
  });
}

// The object form of `schedules`: lists keyed by environment name plus an optional `default` the
// other environments inherit. Every key must be declared in config.cron.environments, so a typo
// cannot silently leave an environment on the defaults.
function validateEnvironmentSchedules({ endpoint, configKey, cronEnvironments }) {
  const declared = getCronEnvironmentNames(cronEnvironments);
  if (declared.length === 0) {
    throw new ConfigError(
      `Endpoint "${endpoint.id}" keys schedules by environment but lowdefy.config.cron.environments is not defined.`,
      { configKey }
    );
  }
  getCronEnvironmentNames(endpoint.schedules).forEach((name) => {
    if (name !== 'default' && !declared.includes(name)) {
      throw new ConfigError(
        `Endpoint schedules environment "${name}" at "${
          endpoint.id
        }" is not declared in lowdefy.config.cron.environments. Declared environments: ${declared.join(
          ', '
        )}.`,
        { configKey }
      );
    }
    const schedules = endpoint.schedules[name];
    const where = ` for environment "${name}"`;
    if (!type.isArray(schedules)) {
      throw new ConfigError(`Endpoint schedules${where} is not an array at "${endpoint.id}".`, {
        received: schedules,
        configKey,
      });
    }
    validateSchedules({ schedules, endpoint, configKey, where });
  });
}

function validateEndpoint({ endpoint, index, checkDuplicateEndpointId, cronEnvironments }) {
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
  if (type.isObject(endpoint.schedules)) {
    validateEnvironmentSchedules({ endpoint, configKey, cronEnvironments });
  } else {
    validateSchedules({ schedules: endpoint.schedules, endpoint, configKey });
  }
}

export default validateEndpoint;
