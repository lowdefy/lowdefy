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

import { validate } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import addStepResult from './addStepResult.js';
import derivePreview from '../notifications/derivePreview.js';
import getNotificationConfig from '../notifications/getNotificationConfig.js';
import resolveNotificationLinks from '../notifications/resolveNotificationLinks.js';

function itemHasPageLinks(item, dataKeys) {
  const links = Object.values(item.links ?? {});
  const arrayLinks = dataKeys.flatMap((key) =>
    (type.isArray(item[key]) ? item[key] : []).map((entry) => entry?.link)
  );
  return [...links, ...arrayLinks].some(
    (link) => type.isObject(link) && !type.isNone(link.pageId)
  );
}

async function handleRenderNotification(context, routineContext, { step }) {
  const { logger, evaluateOperators } = context;

  logger.debug({
    event: 'debug_start_render_notification',
    step,
  });

  const evaluatedProperties = evaluateOperators({
    input: step.properties,
    items: routineContext.items,
    location: step.stepId,
    payload: routineContext.payload,
    state: routineContext.state,
    steps: routineContext.steps,
  });

  const { notificationId, data, landingPage, recordId } = evaluatedProperties;
  let { serverUrl } = evaluatedProperties;
  if (!type.isString(notificationId)) {
    throw new ConfigError(
      `RenderNotification step "${step.stepId}" properties.notificationId must evaluate to a string. Received ${JSON.stringify(notificationId)}.`,
      { configKey: step['~k'] }
    );
  }
  if (type.isArray(data)) {
    throw new ConfigError(
      `RenderNotification step "${step.stepId}" properties.data must evaluate to an object. Received an array — iterate with a ":for" control and render one item per step.`,
      { configKey: step['~k'] }
    );
  }
  if (!type.isObject(data)) {
    throw new ConfigError(
      `RenderNotification step "${step.stepId}" properties.data must evaluate to an object. Received ${JSON.stringify(data)}.`,
      { configKey: step['~k'] }
    );
  }
  if (!type.isNone(serverUrl)) {
    if (!type.isString(serverUrl) || serverUrl === '') {
      throw new ConfigError(
        `RenderNotification step "${step.stepId}" properties.serverUrl must evaluate to a non-empty string. Received ${JSON.stringify(serverUrl)}.`,
        { configKey: step['~k'] }
      );
    }
    serverUrl = serverUrl.replace(/\/$/, '');
  }
  if (!type.isNone(landingPage) && !type.isString(landingPage)) {
    throw new ConfigError(
      `RenderNotification step "${step.stepId}" properties.landingPage must evaluate to a string. Received ${JSON.stringify(landingPage)}.`,
      { configKey: step['~k'] }
    );
  }
  if (!type.isNone(recordId) && !type.isString(recordId)) {
    throw new ConfigError(
      `RenderNotification step "${step.stepId}" properties.recordId must evaluate to a string. Received ${JSON.stringify(recordId)}.`,
      { configKey: step['~k'] }
    );
  }

  const notificationConfig = await getNotificationConfig(context, {
    notificationId,
    configKey: step['~k'],
  });
  const configKey = notificationConfig['~k'];

  const Template = context.notifications[notificationConfig.type];
  if (!Template) {
    throw new ConfigError(
      `Notification template type "${notificationConfig.type}" can not be found.`,
      { configKey }
    );
  }
  const { renderEmail, interpolateProperties } = context;
  if (!type.isFunction(renderEmail) || !type.isFunction(interpolateProperties)) {
    // plugins/notifications.js exports real implementations whenever the app
    // has notifications built — reaching this means the build artifact and
    // config are out of sync.
    throw new ConfigError(
      'Email rendering is not available. Rebuild the app — @lowdefy/email-templates is installed when "notifications:" is configured.',
      { configKey }
    );
  }

  const app = (await context.readConfigFile('app.json')) ?? {};
  const theme = { ...(app.email ?? {}), ...(notificationConfig.theme ?? {}) };
  const basePath = context.config?.basePath ?? '';

  if (itemHasPageLinks(data, Template.dataKeys ?? [])) {
    if (type.isNone(serverUrl)) {
      throw new ConfigError(
        `Notification "${notificationId}" has links but no server URL is available. Set the serverUrl step property.`,
        { configKey: step['~k'] }
      );
    }
    // Landing URLs embed the record id — without it the landing page cannot
    // resolve the record and every link in the email would be dead.
    if (!type.isNone(landingPage) && type.isNone(recordId)) {
      throw new ConfigError(
        `RenderNotification step "${step.stepId}" properties.landingPage requires properties.recordId to compose landing URLs.`,
        { configKey: step['~k'] }
      );
    }
  }
  const resolvedItem = resolveNotificationLinks({
    item: data,
    dataKeys: Template.dataKeys ?? [],
    serverUrl: serverUrl ?? '',
    basePath,
    landingPage,
    recordId,
  });

  let interpolated;
  try {
    interpolated = interpolateProperties({
      properties: notificationConfig.properties,
      data: resolvedItem,
      markdownProperties: Template.markdownProperties ?? [],
    });
  } catch (error) {
    throw new ConfigError(
      `Notification "${notificationId}" template interpolation failed: ${error.message}`,
      { configKey, cause: error }
    );
  }

  if (Template.schema) {
    const { valid, errors } = validate({
      schema: Template.schema,
      data: interpolated,
      returnErrors: true,
    });
    if (!valid) {
      throw new ConfigError(
        `Notification "${notificationId}" properties do not match template "${notificationConfig.type}" schema: ${errors?.[0]?.message}.`,
        { configKey }
      );
    }
  }

  const { html, text } = await renderEmail({
    Template,
    properties: interpolated,
    data: resolvedItem,
    theme,
    links: resolvedItem.links ?? {},
  });

  const result = {
    subject: interpolated.subject,
    title: interpolated.title ?? interpolated.subject,
    preview: derivePreview({ properties: interpolated }),
    html,
    text,
    data: resolvedItem,
  };

  addStepResult(context, routineContext, {
    result,
    stepId: step.stepId,
  });

  logger.debug({
    event: 'debug_end_render_notification',
    stepId: step.stepId,
    notificationId,
  });

  return { status: 'continue' };
}

export default handleRenderNotification;
