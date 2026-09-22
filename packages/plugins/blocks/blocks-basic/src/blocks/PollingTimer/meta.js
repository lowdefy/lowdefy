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
    onTick:
      'Trigger actions on every interval tick while the timer is running. The event object is `{ tick: number }`, the count of ticks since the timer was started.',
  },
  methods: {
    start:
      'Start firing `onTick` every `interval` ms, and reset the tick count to zero. Does nothing if the timer is already running.',
    stop: 'Stop firing ticks. Does nothing if the timer is not running.',
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
          'Required. Milliseconds between ticks. Changing it while the timer is running restarts the interval.',
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
          'Pause ticking while the browser tab is hidden, and resume when it becomes visible again. Ticks missed while hidden are not fired on resume.',
      },
    },
  },
};
