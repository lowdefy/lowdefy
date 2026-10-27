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

import * as Notifications from 'expo-notifications';
import { type } from '@lowdefy/helpers';

function getTrigger({ at, repeats, seconds }) {
  if (type.isString(at)) {
    const date = new Date(at);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`ScheduleNotification "at" should be an ISO date-time. Received "${at}".`);
    }
    return { type: Notifications.SchedulableTriggerInputTypes.DATE, date };
  }
  if (type.isNumber(seconds)) {
    if (repeats === true && seconds < 60) {
      throw new Error('ScheduleNotification with "repeats" needs "seconds" of 60 or more.');
    }
    return {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, seconds),
      repeats: repeats === true,
    };
  }
  return null;
}

/**
 * ScheduleNotification's params as an expo-notifications request: shown now with neither `at` nor
 * `seconds`. `path` goes into data.path, which a tap opens.
 *
 * @param {Object} params ScheduleNotification's params.
 */
function toScheduleRequest(params) {
  const { badge, body, categoryId, data, id, path, title } = params;
  return {
    identifier: id,
    content: {
      title,
      body,
      data: { ...(data ?? {}), ...(type.isString(path) ? { path } : {}) },
      categoryIdentifier: categoryId,
      badge,
    },
    trigger: getTrigger(params),
  };
}

export default toScheduleRequest;
