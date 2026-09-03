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

import validateId from '../../../utils/validateId.js';
import validateRunAs from '../validateRunAs.js';
import validateTenantPipeline from '../../validateTenantPipeline.js';
import collectExceptions from '../../../utils/collectExceptions.js';

function validateStep(
  step,
  { endpointId, stepTypes, tenantConnections, tenantCollectionMap, collections, context }
) {
  const configKey = step['~k'];
  if (Object.keys(step).length === 0) {
    throw new ConfigError(`Step is not defined at endpoint "${endpointId}".`, { configKey });
  }
  if (type.isUndefined(step.id)) {
    throw new ConfigError(`Step id missing at endpoint "${endpointId}".`, { configKey });
  }
  if (!type.isString(step.id)) {
    throw new ConfigError(`Step id is not a string at endpoint "${endpointId}".`, {
      received: step.id,
      configKey,
    });
  }
  validateId({ id: step.id, field: 'Step id', location: `endpoint "${endpointId}"`, configKey });
  if (type.isNone(step.type)) {
    throw new ConfigError(`Step type is not defined at "${step.id}" on endpoint "${endpointId}".`, {
      configKey,
    });
  }
  if (!type.isString(step.type)) {
    throw new ConfigError(
      `Step type is not a string at "${step.id}" on endpoint "${endpointId}".`,
      { received: step.type, configKey }
    );
  }

  // runAs scopes the tenant wall for a request step; it is meaningless on a
  // step that never reaches the wall, and a declaration that silently did
  // nothing is exactly the unscoped-by-accident state the wall exists to
  // prevent. The shape and source checks run for request steps below.
  // A request step is one that names a connection. Excluding a hardcoded list
  // of the step types that are not requests would silently accept a runAs that
  // does nothing on every step type added after this line was written.
  const isRequestStep = !type.isUndefined(step.connectionId);
  if (!type.isUndefined(step.runAs) && !isRequestStep) {
    throw new ConfigError(
      `Step "${step.id}" at endpoint "${endpointId}" declares "runAs", which only applies to request steps — the tenant wall scopes connections, and a ${step.type} step reaches no connection. Declare runAs on the endpoint or on the request steps instead.`,
      { received: step.runAs, configKey }
    );
  }

  if (step.type === 'CallApi') {
    if (type.isNone(step.properties?.endpointId)) {
      throw new ConfigError(
        `Endpoint step "${step.id}" at endpoint "${endpointId}" requires properties.endpointId.`,
        { configKey }
      );
    }
    if (!type.isString(step.properties.endpointId) && !type.isObject(step.properties.endpointId)) {
      throw new ConfigError(
        `Endpoint step "${step.id}" at endpoint "${endpointId}" properties.endpointId is not a string.`,
        { received: step.properties.endpointId, configKey }
      );
    }
    if (!type.isNone(step.connectionId)) {
      throw new ConfigError(
        `Endpoint step "${step.id}" at endpoint "${endpointId}" should not have a connectionId.`,
        { configKey }
      );
    }
    return;
  }

  if (step.type === 'CallAgent') {
    if (type.isNone(step.properties?.agentId)) {
      throw new ConfigError(
        `CallAgent step "${step.id}" at endpoint "${endpointId}" requires properties.agentId.`,
        { configKey }
      );
    }
    if (!type.isString(step.properties.agentId) && !type.isObject(step.properties.agentId)) {
      throw new ConfigError(
        `CallAgent step "${step.id}" at endpoint "${endpointId}" properties.agentId is not a string.`,
        { received: step.properties.agentId, configKey }
      );
    }
    if (type.isNone(step.properties?.prompt)) {
      throw new ConfigError(
        `CallAgent step "${step.id}" at endpoint "${endpointId}" requires properties.prompt.`,
        { configKey }
      );
    }
    if (!type.isString(step.properties.prompt) && !type.isObject(step.properties.prompt)) {
      throw new ConfigError(
        `CallAgent step "${step.id}" at endpoint "${endpointId}" properties.prompt is not a string.`,
        { received: step.properties.prompt, configKey }
      );
    }
    if (!type.isNone(step.connectionId)) {
      throw new ConfigError(
        `CallAgent step "${step.id}" at endpoint "${endpointId}" should not have a connectionId.`,
        { configKey }
      );
    }
    return;
  }

  if (step.type === 'RenderNotification') {
    if (type.isNone(step.properties?.notificationId)) {
      throw new ConfigError(
        `RenderNotification step "${step.id}" at endpoint "${endpointId}" requires properties.notificationId.`,
        { configKey }
      );
    }
    if (
      !type.isString(step.properties.notificationId) &&
      !type.isObject(step.properties.notificationId)
    ) {
      throw new ConfigError(
        `RenderNotification step "${step.id}" at endpoint "${endpointId}" properties.notificationId is not a string.`,
        { received: step.properties.notificationId, configKey }
      );
    }
    if (type.isNone(step.properties?.data)) {
      throw new ConfigError(
        `RenderNotification step "${step.id}" at endpoint "${endpointId}" requires properties.data.`,
        { configKey }
      );
    }
    // One item per render — arrays are iterated with a :for control in the routine.
    if (!type.isObject(step.properties.data)) {
      throw new ConfigError(
        `RenderNotification step "${step.id}" at endpoint "${endpointId}" properties.data is not an object.`,
        { received: step.properties.data, configKey }
      );
    }
    if (!type.isNone(step.connectionId)) {
      throw new ConfigError(
        `RenderNotification step "${step.id}" at endpoint "${endpointId}" should not have a connectionId.`,
        { configKey }
      );
    }
    return;
  }

  if (step.type === 'ValidateSchema') {
    if (type.isNone(step.properties?.schema)) {
      throw new ConfigError(
        `ValidateSchema step "${step.id}" at endpoint "${endpointId}" requires properties.schema.`,
        { configKey }
      );
    }
    if (type.isNone(step.properties?.data)) {
      throw new ConfigError(
        `ValidateSchema step "${step.id}" at endpoint "${endpointId}" requires properties.data.`,
        { configKey }
      );
    }
    if (!type.isNone(step.connectionId)) {
      throw new ConfigError(
        `ValidateSchema step "${step.id}" at endpoint "${endpointId}" should not have a connectionId.`,
        { configKey }
      );
    }
    return;
  }

  if (stepTypes?.[step.type]) {
    if (!type.isNone(step.connectionId)) {
      throw new ConfigError(
        `Auth step "${step.id}" at endpoint "${endpointId}" should not have a connectionId.`,
        { configKey }
      );
    }
    if (!type.isNone(step.properties) && !type.isObject(step.properties)) {
      throw new ConfigError(
        `Auth step "${step.id}" at endpoint "${endpointId}" properties is not an object.`,
        { received: step.properties, configKey }
      );
    }
    if (!type.isNone(step.system) && !type.isBoolean(step.system)) {
      throw new ConfigError(
        `Auth step "${step.id}" at endpoint "${endpointId}" system must be a boolean.`,
        { received: step.system, configKey }
      );
    }
    return;
  }

  if (type.isUndefined(step.connectionId)) {
    throw new ConfigError(`Step connectionId missing at endpoint "${endpointId}".`, {
      configKey,
    });
  }
  if (!type.isString(step.connectionId)) {
    throw new ConfigError(`Step connectionId is not a string at endpoint "${endpointId}".`, {
      received: step.connectionId,
      configKey,
    });
  }
  // Step-level tenant values are the exception sentinels — the wall itself is
  // declared on the connection, never per step. "none" opts the step out of
  // the wall (system context); "authored" declares the step authors its own
  // tenant clause in a stage the wall can not scope mechanically, audited at
  // runtime.
  if (!type.isUndefined(step.tenant) && step.tenant !== 'none' && step.tenant !== 'authored') {
    throw new ConfigError(
      `Step "${step.id}" at endpoint "${endpointId}" "tenant" only accepts "none" or "authored" — the tenant wall is declared on the connection.`,
      { received: step.tenant, configKey }
    );
  }

  validateRunAs({
    runAs: step.runAs,
    location: `Step "${step.id}" at endpoint "${endpointId}"`,
    configKey,
    level: 'step',
  });
  if (!type.isUndefined(step.runAs) && step.tenant === 'none') {
    throw new ConfigError(
      `Step "${step.id}" at endpoint "${endpointId}" declares both "runAs" and "tenant: none" — one scopes the step to an organization, the other switches the wall off. Remove "tenant: none".`,
      { configKey }
    );
  }

  // Best-effort (literal pipelines only): every refusal the tenant wall raises
  // at request time on a walled pipeline, raised at build instead. With a build
  // context every finding is collected so one build reports them all; a caller
  // without one gets the first finding thrown.
  const tenantPipelineErrors = validateTenantPipeline({
    config: step,
    location: `Step "${step.id}" at endpoint "${endpointId}"`,
    tenantConnections,
    tenantCollectionMap,
    collections,
    configKey,
  });
  if (tenantPipelineErrors.length === 0) return;
  if (type.isNone(context)) {
    throw tenantPipelineErrors[0];
  }
  tenantPipelineErrors.forEach((error) => collectExceptions(context, error));
}

export default validateStep;
