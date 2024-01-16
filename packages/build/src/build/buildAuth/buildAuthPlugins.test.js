/*
  Copyright 2020-2024 Lowdefy, Inc

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

import buildAuthPlugins from './buildAuthPlugins.js';
import testContext from '../../test/testContext.js';

test('Count adapter type', () => {
  const context = testContext();
  const components = {
    auth: {
      adapter: {
        id: 'adapter',
        type: 'Adapter',
        properties: {
          x: 1,
        },
      },
    },
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.adapters.getCounts()).toEqual({ Adapter: 1 });
});

test('Count provider types', () => {
  const context = testContext();
  const components = {
    auth: {
      providers: [
        {
          id: 'provider1',
          type: 'Provider1',
          properties: {
            x: 1,
          },
        },
        {
          id: 'provider2',
          type: 'Provider2',
          properties: {
            x: 1,
          },
        },
      ],
    },
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.providers.getCounts()).toEqual({ Provider1: 1, Provider2: 1 });
});

test('Count callback types', () => {
  const context = testContext();
  const components = {
    auth: {
      callbacks: [
        {
          id: 'callback1',
          type: 'Callback1',
          properties: {
            x: 1,
          },
        },
        {
          id: 'callback2',
          type: 'Callback2',
          properties: {
            x: 1,
          },
        },
      ],
    },
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.callbacks.getCounts()).toEqual({ Callback1: 1, Callback2: 1 });
});

test('Count event types types', () => {
  const context = testContext();
  const components = {
    auth: {
      events: [
        {
          id: 'event1',
          type: 'Event1',
          properties: {
            x: 1,
          },
        },
        {
          id: 'event2',
          type: 'Event2',
          properties: {
            x: 1,
          },
        },
      ],
    },
  };
  buildAuthPlugins({ components, context });
  expect(context.typeCounters.auth.events.getCounts()).toEqual({ Event1: 1, Event2: 1 });
});

test('Adapter validation', () => {
  const context = testContext();
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          adapter: {
            type: 'Adapter',
            properties: {
              x: 1,
            },
          },
        },
      },
      context,
    })
  ).toThrow('Auth adapter id missing.');
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          adapter: {
            id: true,
            type: 'Adapter',
            properties: {
              x: 1,
            },
          },
        },
      },
      context,
    })
  ).toThrow('Auth adapter id is not a string. Received true.');
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          adapter: {
            id: 'adapter',
            properties: {
              x: 1,
            },
          },
        },
      },
      context,
    })
  ).toThrow('Auth adapter type is not a string at adapter "adapter". Received undefined.');
});

test('Provider validation', () => {
  const context = testContext();
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          providers: [
            {
              type: 'Provider',
              properties: {
                x: 1,
              },
            },
          ],
        },
      },
      context,
    })
  ).toThrow('Auth provider id missing.');
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          providers: [
            {
              id: true,
              type: 'Provider',
              properties: {
                x: 1,
              },
            },
          ],
        },
      },
      context,
    })
  ).toThrow('Auth provider id is not a string. Received true.');
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          providers: [
            {
              id: 'provider',
              properties: {
                x: 1,
              },
            },
          ],
        },
      },
      context,
    })
  ).toThrow('Auth provider type is not a string at provider "provider". Received undefined.');
});

test('Callback validation', () => {
  const context = testContext();
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          callbacks: [
            {
              type: 'Callback',
              properties: {
                x: 1,
              },
            },
          ],
        },
      },
      context,
    })
  ).toThrow('Auth callback id missing.');
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          callbacks: [
            {
              id: true,
              type: 'Callback',
              properties: {
                x: 1,
              },
            },
          ],
        },
      },
      context,
    })
  ).toThrow('Auth callback id is not a string. Received true.');
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          callbacks: [
            {
              id: 'callback',
              properties: {
                x: 1,
              },
            },
          ],
        },
      },
      context,
    })
  ).toThrow('Auth callback type is not a string at callback "callback". Received undefined.');
});

test('Events validation', () => {
  const context = testContext();
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          events: [
            {
              type: 'Event',
              properties: {
                x: 1,
              },
            },
          ],
        },
      },
      context,
    })
  ).toThrow('Auth event id missing.');
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          events: [
            {
              id: true,
              type: 'Event',
              properties: {
                x: 1,
              },
            },
          ],
        },
      },
      context,
    })
  ).toThrow('Auth event id is not a string. Received true.');
  expect(() =>
    buildAuthPlugins({
      components: {
        auth: {
          events: [
            {
              id: 'event',
              properties: {
                x: 1,
              },
            },
          ],
        },
      },
      context,
    })
  ).toThrow('Auth event type is not a string at event "event". Received undefined.');
});
