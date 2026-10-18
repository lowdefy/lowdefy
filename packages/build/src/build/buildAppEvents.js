/* eslint-disable no-param-reassign */

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

import compileAppEvents from './compileAppEvents.js';

// The web app's events. A shell runs mobile.events instead
// (buildMobileAppEvents), so these may use web-only actions.
function buildAppEvents({ components, context }) {
  if (type.isNone(components.events)) {
    components.events = {};
  }
  // Every page runs the app events if it is the first to load, so every page's
  // type set carries their types (buildPageTypes).
  context.appTypeCounters = compileAppEvents({
    components,
    configKey: components['~k'],
    context,
    events: components.events,
    label: 'App event',
    path: 'events',
    typeCounters: context.typeCounters,
  });
  return components;
}

export default buildAppEvents;
