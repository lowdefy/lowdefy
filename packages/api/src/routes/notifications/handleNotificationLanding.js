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

import { get, type, urlQuery } from '@lowdefy/helpers';

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import getNotificationAdapter from './getNotificationAdapter.js';
import getNotificationConfig from './getNotificationConfig.js';

// Email link clicks land here: mark the record read and redirect to the target
// resolved from the stored data. Session enforcement stays in the server route;
// this function is engine-agnostic. A clicked email link should never 500 —
// every miss falls back to a redirect to the app root.
async function handleNotificationLanding(context, { recordId, notificationId, option }) {
  const { logger } = context;
  context.evaluateOperators = createEvaluateOperators(context);

  try {
    const notificationConfig = await getNotificationConfig(context, { notificationId });
    const { adapter, connectionProperties } = await getNotificationAdapter(context, {
      connectionId: notificationConfig.dataConnectionId,
      configKey: notificationConfig['~k'],
    });

    const record = await adapter.getNotification({
      connection: connectionProperties,
      id: recordId,
    });
    if (type.isNone(record)) {
      logger.warn({ event: 'warn_notification_landing_not_found', recordId, notificationId });
      return { redirect: '/' };
    }

    await adapter.markNotificationRead({ connection: connectionProperties, id: recordId });

    const link = get(record.data ?? {}, option ?? 'links.button');
    if (type.isString(link)) {
      return { redirect: link };
    }
    if (type.isObject(link) && !type.isNone(link.pageId)) {
      const query = urlQuery.stringify(link.urlQuery ?? {});
      return { redirect: `/${link.pageId}${query ? `?${query}` : ''}` };
    }
    return { redirect: '/' };
  } catch (error) {
    logger.warn({ event: 'warn_notification_landing_failed', recordId, notificationId, err: error });
    return { redirect: '/' };
  }
}

export default handleNotificationLanding;
