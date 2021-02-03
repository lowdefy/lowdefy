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
    this.createTrigger = this.createTrigger.bind(this);
    this.callRec = this.callRec.bind(this);
    this.registerEvent = this.registerEvent.bind(this);

    this.init();
  }

  callRec(event, actions, results, resolve, reject) {
    if (actions.length > 0) {
      // eslint-disable-next-line no-unused-vars
      const { fn, success, error, ...action } = actions[0];
      try {
        const skip = this.context.parser.parse({
          event,
          arrayIndices: this.arrayIndices,
          input: action.skip,
          location: this.block.blockId,
        });
        if (skip.output) {
          results.unshift({ actionId: action.id, actionType: action.type, skipped: true });
          this.callRec(event, actions.slice(1), results, resolve, reject);
        } else {
          fn({ event, arrayIndices: this.arrayIndices, blockId: this.block.blockId })
            .then((result) => {
              results.unshift({
                ...result,
                event,
                ...action,
                skipped: false,
              });
              this.callRec(event, actions.slice(1), results, resolve, reject);
            })
            .catch((e) => {
              results.unshift({
                ...e,
                event,
                ...action,
                skipped: false,
              });
              reject(results);
            });
        }
      } catch (e) {
        results.unshift({
          event,
          ...action,
          skipped: false,
          error: e,
        });
        reject(results);
      }
    } else {
      resolve(results);
    }
  }

  createTrigger(actions) {
    const fnActions = this.context.Actions.build(actions);
    return (event) =>
      new Promise((resolve, reject) => {
        this.callRec(event, fnActions, [], resolve, reject);
      });
  }

  init() {
    Object.keys(this.block.actions).forEach((eventName) => {
      this.events[eventName] = {
        loading: false,
        history: [],
        trigger: this.createTrigger(this.block.actions[eventName]),
      };
    });
  }

  triggerEvent({ name, event, hideLoading }) {
    if (type.isUndefined(this.events[name])) {
      return Promise.resolve();
    }
    this.events[name].loading = true;
    this.context.update(this.block.id);
    let loader = () => true;
    if (!hideLoading) {
      loader = this.context.displayMessage.loading('Loading...', 0);
    }
    return this.events[name] // return to promise to await in test
      .trigger(event)
      .then((results) => {
        this.events[name].history.unshift({
          event,
          timestamp: new Date(),
          success: results.map((res) => res.successMessage || null),
        });
        results.reverse().forEach((result) => {
          if (result.successMessage) {
            this.context.displayMessage.success(result.successMessage);
          }
        });
        this.context.eventLog.push({
          blockId: this.block.blockId,
          eventName: name,
          response: results,
          timestamp: new Date(),
          status: 'success',
        });
        this.events[name].loading = false;
        this.block.update = true;
        this.context.update();

        loader();
        return results;
      })
      .catch((results) => {
        this.events[name].history.unshift({
          event,
          timestamp: new Date(),
          error: results.map((res) => ({
            ...res,
            error: type.isError(res.error)
              ? { error: res.error, message: res.error.message, name: res.error.name }
              : null,
          })),
        });
        results.reverse().forEach((result) => {
          if (result.successMessage) {
            this.context.displayMessage.success(result.successMessage);
          }
          if (result.errorMessage) {
            this.context.displayMessage.error(result.errorMessage, 6);
          }
        });
        this.context.eventLog.push({
          blockId: this.block.blockId,
          eventName: name,
          response: results,
          timestamp: new Date(),
          status: 'error',
        });
        this.events[name].loading = false;
        this.block.update = true;
        this.context.update();
        loader();
        return results;
      });
  }

  registerEvent({ name, actions }) {
    this.events[name] = {
      loading: false,
      history: [],
      trigger: this.createTrigger(actions),
    };
  }
}

export default Events;
