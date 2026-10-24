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

import getDeviceFeature from '../../device/getDeviceFeature.js';

// Reads events from the phone's calendars between two dates: [{ id, title, start, end, allDay,
// location, notes, calendar }]. Asks for calendar access first. Shells with the calendar
// extension.
async function GetCalendarEvents({ params }) {
  if (type.isNone(params?.start)) {
    throw new Error(`GetCalendarEvents requires "start". Received ${JSON.stringify(params)}.`);
  }
  if (type.isNone(params?.end)) {
    throw new Error(`GetCalendarEvents requires "end". Received ${JSON.stringify(params)}.`);
  }
  return getDeviceFeature({ feature: 'calendar', action: 'GetCalendarEvents' }).getEvents(
    params ?? {}
  );
}

export default GetCalendarEvents;
