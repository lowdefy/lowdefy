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

import crypto from 'crypto';

import { validate } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import addStepResult from './addStepResult.js';
import createNotificationRecord from '../notifications/createNotificationRecord.js';
import getMailSend from '../notifications/getMailSend.js';
import getNotificationAdapter from '../notifications/getNotificationAdapter.js';
import getNotificationConfig from '../notifications/getNotificationConfig.js';
import resolveNotificationLinks from '../notifications/resolveNotificationLinks.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function itemHasPageLinks(item) {
  const links = Object.values(item.links ?? {});
  const arrayLinks = ['actions', 'items'].flatMap((key) =>
    (type.isArray(item[key]) ? item[key] : []).map((entry) => entry?.link)
  );
  return [...links, ...arrayLinks].some(
    (link) => type.isObject(link) && !type.isNone(link.pageId)
  );
}

function getServerUrl({ app }) {
  if (type.isString(app.serverUrl) && app.serverUrl !== '') {
    return app.serverUrl.replace(/\/$/, '');
  }
  // VERCEL_URL is the deployment URL (no protocol), not a custom domain —
  // production apps set app.serverUrl explicitly.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return null;
}

async function handleSendNotification(context, routineContext, { step }) {
  const { logger, evaluateOperators } = context;

  logger.debug({
    event: 'debug_start_send_notification',
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

  const { notificationId, data } = evaluatedProperties;
  if (!type.isString(notificationId)) {
    throw new ConfigError(
      `SendNotification step "${step.stepId}" properties.notificationId must evaluate to a string. Received ${JSON.stringify(notificationId)}.`,
      { configKey: step['~k'] }
    );
  }
  if (!type.isObject(data) && !type.isArray(data)) {
    throw new ConfigError(
      `SendNotification step "${step.stepId}" properties.data must evaluate to an object or array. Received ${JSON.stringify(data)}.`,
      { configKey: step['~k'] }
    );
  }
  const items = type.isArray(data) ? data : [data];

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
  // Unset means links go directly to their target pages; setting it routes
  // links through a landing page (e.g. a notifications module page) that
  // marks the record read before redirecting.
  const landingPage = app.notificationLandingPage;
  const basePath = context.config?.basePath ?? '';
  const serverUrl = getServerUrl({ app });

  const { send, connectionProperties: emailConnectionProperties } = await getMailSend(context, {
    connectionId: notificationConfig.emailConnectionId,
    configKey,
  });
  const { adapter, connectionProperties: dataConnectionProperties } = await getNotificationAdapter(
    context,
    {
      connectionId: notificationConfig.dataConnectionId,
      configKey,
    }
  );

  const ids = [];

  for (const item of items) {
    if (!type.isObject(item.contact) || type.isNone(item.contact._id)) {
      throw new ConfigError(
        `SendNotification step "${step.stepId}" data item requires a "contact" object with an "_id". Received ${JSON.stringify(item.contact)}.`,
        { configKey: step['~k'] }
      );
    }
    const contact = item.contact;
    const email = String(contact.email ?? '')
      .trim()
      .toLowerCase();
    const isValidEmail = emailRegex.test(email);

    // Generated before link resolution because landing URLs embed the record id.
    const recordId = crypto.randomUUID();

    if (itemHasPageLinks(item) && serverUrl === null) {
      throw new ConfigError(
        `Notification "${notificationId}" has links but no server URL is available. Set app.serverUrl.`,
        { configKey }
      );
    }
    const resolvedItem = resolveNotificationLinks({
      item,
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

    const record = createNotificationRecord({
      id: recordId,
      notificationConfig,
      item,
      properties: interpolated,
      contact,
      email,
      isValidEmail,
      html,
      text,
      appName: context.appMeta?.name,
    });

    // Insert before sending — claims the deduplication key so concurrent runs
    // cannot double-send. Duplicate key → skip silently.
    const inserted = await adapter.insertNotification({
      connection: dataConnectionProperties,
      notification: record,
    });
    if (inserted === null) {
      logger.debug({
        event: 'debug_send_notification_duplicate',
        notificationId,
        key: record.key,
      });
      continue;
    }

    const sendNow =
      record.send_email && isValidEmail && notificationConfig.delivery !== 'deferred';
    if (sendNow) {
      try {
        const result = await send({
          connection: emailConnectionProperties,
          mail: {
            to: email,
            cc: record.cc ?? undefined,
            bcc: record.bcc ?? undefined,
            subject: record.subject,
            text: record.text,
            html: record.body,
          },
        });
        await adapter.updateNotificationSendResult({
          connection: dataConnectionProperties,
          id: recordId,
          sent: true,
          email_result: { messageId: result?.messageId ?? null, timestamp: new Date() },
        });
      } catch (error) {
        // A send failure never fails the step — the record stays sent: false
        // and the drain endpoint retries it.
        await adapter.updateNotificationSendResult({
          connection: dataConnectionProperties,
          id: recordId,
          increment_send_attempts: true,
          last_attempt: new Date(),
        });
        logger.warn({
          event: 'warn_send_notification_failed',
          notificationId,
          id: recordId,
          err: error,
        });
      }
    }

    ids.push(recordId);
  }

  addStepResult(context, routineContext, {
    result: ids,
    stepId: step.stepId,
  });

  logger.debug({
    event: 'debug_end_send_notification',
    stepId: step.stepId,
    notificationId,
    count: ids.length,
  });

  return { status: 'continue' };
}

export default handleSendNotification;
