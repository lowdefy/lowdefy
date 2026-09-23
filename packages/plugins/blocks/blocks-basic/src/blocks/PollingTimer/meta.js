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

export default {
  category: 'display',
  icons: [],
  valueType: null,
  events: {
    onTick: {
      description:
        'Trigger actions on every tick while the timer is running. The next tick is scheduled `interval` ms after the `onTick` actions finish, so ticks never overlap.',
      event: {
        tick: 'The number of ticks since the timer was started, starting at 1.',
      },
    },
  },
  methods: {
    start:
      'Start the timer and reset the tick count to zero. The first tick fires after `interval` ms. Does nothing if the timer is already running.',
    stop: 'Stop the timer. If `onTick` actions are running, they finish but no further tick is scheduled. Does nothing if the timer is not running.',
    toggle: 'Start the timer if it is stopped, stop it if it is running.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      interval: {
        type: 'integer',
        minimum: 1,
        description:
          'Milliseconds to wait after the `onTick` actions of one tick finish before the next tick fires. Changing it while the timer is waiting restarts the wait.',
      },
      autoStart: {
        type: 'boolean',
        default: false,
        description:
          'Start ticking when the block mounts. Off by default, so the timer is started with the `start` method.',
      },
      maxTicks: {
        type: 'integer',
        minimum: 1,
        description:
          'Stop the timer after this many ticks. The `onTick` event of the last tick is still triggered. Unlimited by default.',
      },
      pauseWhenHidden: {
        type: 'boolean',
        default: true,
        description:
          'Pause ticking while the browser tab is hidden (`document.visibilityState`), and resume when it becomes visible again. Ticks missed while hidden are not fired on resume; the next tick fires `interval` ms after the tab is visible.',
      },
    },
    required: ['interval'],
  },
};
