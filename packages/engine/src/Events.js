/*
  Copyright 2020-2021 Lowdefy, Inc

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
    this.events = {};
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

  async triggerEvent({ name, event }) {
    const eventDescription = this.events[name];
    if (type.isUndefined(eventDescription)) {
      return {
        blockId: this.block.blockId,
        event,
        eventName: name,
        responses: {},
        endTimestamp: new Date(),
        startTimestamp: new Date(),
        success: true,
      };
    }
    eventDescription.loading = true;
    this.block.update = true;
    this.context.update();

    const result = await this.context.Actions.callActions({
      actions: eventDescription.actions,
      arrayIndices: this.arrayIndices,
      block: this.block,
      catchActions: eventDescription.catchActions,
      event,
      eventName: name,
    });

    eventDescription.history.unshift(result);
    this.context.eventLog.unshift(result);
    eventDescription.loading = false;
    this.block.update = true;
    this.context.update();

    return result;
  }
}

export default Events;
