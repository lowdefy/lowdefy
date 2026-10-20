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

import { getCalendars, listEvents, requestCalendarPermissions } from 'expo-calendar';
import { createEventInCalendarAsync } from 'expo-calendar/legacy';

const HOUR = 60 * 60 * 1000;

/**
 * The calendar device feature (the calendar extension): AddCalendarEvent opens the system event
 * editor filled in, for the person to save; GetCalendarEvents reads events between two dates from
 * every calendar, after asking for calendar access.
 */
const calendar = {
  async add({ allDay, end, location, notes, start, title, url }) {
    const startDate = new Date(start);
    // The system editor needs no calendar permission; SDK 58 keeps it under expo-calendar/legacy.
    const result = await createEventInCalendarAsync({
      allDay: allDay === true,
      endDate: end ? new Date(end) : new Date(startDate.getTime() + HOUR),
      location,
      notes,
      startDate,
      title,
      url,
    });
    return result.action === 'saved' || result.action === 'done' ? { id: result.id ?? null } : null;
  },
  async getEvents({ end, start }) {
    const { granted } = await requestCalendarPermissions();
    if (!granted) {
      throw new Error('Calendar permission was denied.');
    }
    const calendars = await getCalendars();
    const byId = Object.fromEntries(calendars.map((item) => [item.id, item.title]));
    const events = await listEvents(calendars, new Date(start), new Date(end));
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startDate).toISOString(),
      end: new Date(event.endDate).toISOString(),
      allDay: event.allDay === true,
      location: event.location ?? null,
      notes: event.notes ?? null,
      calendar: byId[event.calendarId] ?? null,
    }));
  },
};

// The calendar extension's device features (profiles.js CALENDAR_ENTRY).
const features = { calendar };
const hosts = [];

export { features, hosts };
