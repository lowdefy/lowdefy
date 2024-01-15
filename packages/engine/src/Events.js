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

import { type } from '@lowdefy/helpers';

class Events {
  constructor({ arrayIndices, block, context }) {
    this.defaultDebounceMs = 300;
    this.events = {};
    this.timeouts = {};
    this.arrayIndices = arrayIndices;
    this.block = block;
    this.context = context;

    this.init = this.init.bind(this);
    this.triggerEvent = this.triggerEvent.bind(this);
    this.registerEvent = this.registerEvent.bind(this);
    this.initEvent = this.initEvent.bind(this);

    this.init();
  }

  initEvent(actions) {
    return {
      actions: (type.isObject(actions) ? actions.try : actions) || [],
      catchActions: (type.isObject(actions) ? actions.catch : []) || [],
      debounce: type.isObject(actions) ? actions.debounce : null,
      history: [],
      loading: false,
    };
  }

  init() {
    Object.keys(this.block.events).forEach((eventName) => {
      this.events[eventName] = this.initEvent(this.block.events[eventName]);
    });
  }

  registerEvent({ name, actions }) {
    this.events[name] = this.initEvent(actions);
  }

  triggerEvent({ name, event, progress }) {
    this.context._internal.lowdefy.eventCallback?.({ name, blockId: this.block.blockId });
    const eventDescription = this.events[name];
    const result = {
      blockId: this.block.blockId,
      event,
      eventName: name,
      responses: {},
      endTimestamp: new Date(),
      startTimestamp: new Date(),
      success: true,
      bounced: false,
    };
    // no event
    if (type.isUndefined(eventDescription)) {
      return result;
    }
    eventDescription.loading = true;
    this.block.update = true;
    this.context._internal.update();

    const actionHandle = async () => {
      const res = await this.context._internal.Actions.callActions({
        actions: eventDescription.actions,
        arrayIndices: this.arrayIndices,
        block: this.block,
        catchActions: eventDescription.catchActions,
        event,
        eventName: name,
        progress,
      });
      eventDescription.history.unshift(res);
      this.context.eventLog.unshift(res);
      eventDescription.loading = false;
      this.block.update = true;
      this.context._internal.update();
      return res;
    };

    // no debounce
    if (type.isNone(eventDescription.debounce)) {
      return actionHandle();
    }
    const delay = !type.isNone(eventDescription.debounce.ms)
      ? eventDescription.debounce.ms
      : this.defaultDebounceMs;
    // leading edge: bounce
    if (this.timeouts[name] && eventDescription.debounce.immediate === true) {
      result.bounced = true;
      eventDescription.history.unshift(result);
      this.context.eventLog.unshift(result);
      return result;
    }
    // leading edge: trigger
    if (eventDescription.debounce.immediate === true) {
      this.timeouts[name] = setTimeout(() => {
        this.timeouts[name] = null;
      }, delay);
      return actionHandle();
    }

    // trailing edge
    if (eventDescription.bouncer) {
      eventDescription.bouncer();
    }
    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        eventDescription.bouncer = null;
        const res = await actionHandle();
        resolve(res);
      }, delay);

      eventDescription.bouncer = () => {
        clearTimeout(timeout);
        result.bounced = true;
        eventDescription.history.unshift(result);
        this.context.eventLog.unshift(result);
        resolve(result);
      };
    });
  }
}

export default Events;
