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

import claimDomEvent from './claimDomEvent.js';
import createTracePayload from './trace/createTracePayload.js';
import getTrace from './trace/getTrace.js';

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
    this.getDebounceMs = this.getDebounceMs.bind(this);

    this.init();
  }

  initEvent(actions) {
    return {
      actions: (type.isObject(actions) ? actions.try : actions) || [],
      catchActions: (type.isObject(actions) ? actions.catch : []) || [],
      bubble: type.isObject(actions) ? actions.bubble === true : false,
      debounce: type.isObject(actions) ? actions.debounce : null,
      shortcut: type.isObject(actions) ? actions.shortcut ?? null : null,
      history: [],
      loading: false,
    };
  }

  getDebounceMs(eventDescription) {
    if (type.isNone(eventDescription.debounce)) {
      return 0;
    }
    if (type.isNone(eventDescription.debounce.ms)) {
      return this.defaultDebounceMs;
    }
    return eventDescription.debounce.ms;
  }

  init() {
    Object.keys(this.block.events).forEach((eventName) => {
      this.events[eventName] = this.initEvent(this.block.events[eventName]);
    });
  }

  // Events a block registers for its own machinery (Upload's policy request, a Table's row
  // fetch). They are internal: see claimDomEvent.
  registerEvent({ name, actions }) {
    this.events[name] = { ...this.initEvent(actions), internal: true };
  }

  triggerEvent({ name, event, progress }) {
    this.context._internal.lowdefy.eventCallback?.({ name, blockId: this.block.blockId });
    // Own events only: a name like __proto__ from HTML data-event must not
    // reach Object.prototype.
    const eventDescription = Object.hasOwn(this.events, name) ? this.events[name] : undefined;
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
    const handledBy = claimDomEvent({
      blockId: this.block.blockId,
      bubble: eventDescription?.bubble === true,
      hasActions: !type.isUndefined(eventDescription),
      internal: eventDescription?.internal === true,
    });
    if (!type.isNull(handledBy)) {
      result.handledBy = handledBy;
      return result;
    }
    // no event
    if (type.isUndefined(eventDescription)) {
      return result;
    }
    eventDescription.loading = true;
    this.block.update = true;
    // Only render flags changed, which no operator reads.
    this.context._internal.update({ changes: [] });

    const trace = getTrace(this.context._internal.lowdefy);
    const actionHandle = async () => {
      // Copied only while a subscriber asked for state, so production pays no copy per event.
      const stateBefore = trace.wantsState() ? serializer.copy(this.context.state) : undefined;
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
      // Only completed events reach here: bounced events, handledBy returns and events with
      // no actions never emit, so subscribers need not filter them. An app with no analytics
      // and no dev recorder has no subscribers, so it builds no payload per event.
      if (trace.hasSubscribers()) {
        trace.emit(
          createTracePayload({
            actions: [...eventDescription.actions, ...eventDescription.catchActions],
            block: this.block,
            context: this.context,
            debounceMs: this.getDebounceMs(eventDescription),
            record: res,
            stateBefore,
          })
        );
      }
      eventDescription.loading = false;
      this.block.update = true;
      this.context._internal.update({ changes: ['eventLog'] });
      return res;
    };

    // no debounce
    if (type.isNone(eventDescription.debounce)) {
      return actionHandle();
    }
    const delay = this.getDebounceMs(eventDescription);
    // leading edge: bounce
    if (this.timeouts[name] && eventDescription.debounce.immediate === true) {
      result.bounced = true;
      eventDescription.history.unshift(result);
      this.context.eventLog.unshift(result);
      this.context._internal.DependencyTracker.reportChange('eventLog');
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
        this.context._internal.DependencyTracker.reportChange('eventLog');
        resolve(result);
      };
    });
  }
}

export default Events;
