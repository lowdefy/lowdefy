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

import collectExceptions from '../../utils/collectExceptions.js';
import compileAppEvents from '../compileAppEvents.js';

// A shell runs mobile.events, never the web app's events, so a web-only action
// in the root events (an analytics init, say) never reaches a phone. They are
// built like the root events, with their client types counted into the mobile
// counters, and each action type must have a native version, as on a mobile
// page. Their types join every mobile page's type set (buildMobilePageIndex).
function buildMobileAppEvents({ components, context }) {
  if (type.isNone(components.mobile)) {
    return components;
  }
  const { mobile } = components;
  if (type.isNone(mobile.events)) {
    mobile.events = {};
  }
  const pageCounters = compileAppEvents({
    components,
    configKey: mobile['~k'],
    context,
    events: mobile.events,
    label: 'Mobile app event',
    path: 'mobile.events',
    typeCounters: context.typeCountersMobile,
  });
  context.mobileAppTypeCounters = pageCounters;
  Object.keys(pageCounters.actions.getCounts()).forEach((actionType) => {
    if (context.typesMapMobile.actions[actionType]) {
      return;
    }
    collectExceptions(
      context,
      new ConfigError(
        `Action type "${actionType}" in "mobile.events" has no native version, so a mobile shell cannot run it.`,
        { configKey: pageCounters.actions.getLocation(actionType), checkSlug: 'types' }
      )
    );
  });
  return components;
}

export default buildMobileAppEvents;
