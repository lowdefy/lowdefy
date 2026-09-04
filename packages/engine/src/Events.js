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

import { serializer, type } from '@lowdefy/helpers';

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
      shortcut: type.isObject(actions) ? actions.shortcut ?? null : null,
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
      // The journey recorder (client) turns a completed event into one trace
      // event. It needs the state as it stood before the chain ran to report
      // what the chain wrote, so the snapshot is taken only when a recorder is
      // listening - an app that records nothing copies nothing.
      const recordJourneyEvent = this.context._internal.lowdefy.recordJourneyEvent;
      const stateBefore = recordJourneyEvent ? serializer.copy(this.context.state) : null;
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
      // The declared actions travel with the record because the record only
      // holds responses: an 'async: true' action has no response yet when the
      // event completes, and the recorder can only call it pending if it knows
      // the action was declared.
      recordJourneyEvent?.({
        actions: [...eventDescription.actions, ...eventDescription.catchActions],
        blockType: this.block.type,
        context: this.context,
        record: res,
        stateBefore,
      });
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
