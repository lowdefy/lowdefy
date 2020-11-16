/*
  Copyright 2020 Lowdefy, Inc

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

class BlockActions {
  constructor({ arrayIndices, block, context }) {
    this.actions = {};
    this.arrayIndices = arrayIndices;
    this.block = block;
    this.context = context;

    this.init = this.init.bind(this);
    this.callAction = this.callAction.bind(this);
    this.createCall = this.createCall.bind(this);
    this.callRec = this.callRec.bind(this);
    this.registerAction = this.registerAction.bind(this);

    this.init();
  }

  callRec(args, actions, results, resolve, reject) {
    if (actions.length > 0) {
      // eslint-disable-next-line no-unused-vars
      const { fn, success, error, ...action } = actions[0];
      try {
        const skip = this.context.parser.parse({
          args,
          arrayIndices: this.arrayIndices,
          input: action.skip,
          location: this.block.blockId,
        });
        if (skip.output) {
          results.unshift({ actionId: action.id, actionType: action.type, skipped: true });
          this.callRec(args, actions.slice(1), results, resolve, reject);
        } else {
          fn({ args, arrayIndices: this.arrayIndices, blockId: this.block.blockId })
            .then((result) => {
              results.unshift({
                ...result,
                args,
                ...action,
                skipped: false,
              });
              this.callRec(args, actions.slice(1), results, resolve, reject);
            })
            .catch((e) => {
              results.unshift({
                ...e,
                args,
                ...action,
                skipped: false,
              });
              reject(results);
            });
        }
      } catch (e) {
        results.unshift({
          args,
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

  createCall(actions) {
    const fnActions = this.context.Actions.build(actions);
    return (args) =>
      new Promise((resolve, reject) => {
        this.callRec(args, fnActions, [], resolve, reject);
      });
  }

  init() {
    Object.keys(this.block.actions).forEach((actionName) => {
      this.actions[actionName] = {
        loading: false,
        calls: [],
        call: this.createCall(this.block.actions[actionName]),
        actionName,
      };
    });
  }

  callAction({ action, args, hideLoading }) {
    const actionName = action;
    if (type.isUndefined(this.actions[actionName])) {
      return Promise.resolve();
    }
    this.actions[actionName].loading = true;
    this.context.update(this.block.id);
    let loader = () => true;
    if (!hideLoading) {
      loader = this.context.displayMessage.loading('Loading...', 0);
    }
    return this.actions[actionName] // return to promise to await in test
      .call(args)
      .then((results) => {
        this.actions[actionName].calls.unshift({
          args,
          ts: new Date(),
          success: results.map((res) => res.successMessage || null),
        });
        results.reverse().forEach((result) => {
          if (result.successMessage) {
            this.context.displayMessage.success(result.successMessage);
          }
        });
        this.context.actionLog.push({
          blockId: this.block.blockId,
          actionName,
          response: results,
          ts: new Date(),
          status: 'success',
        });
        this.actions[actionName].loading = false;
        this.block.update = true;
        this.context.update();

        loader();
        return results;
      })
      .catch((results) => {
        this.actions[actionName].calls.unshift({
          args,
          ts: new Date(),
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
        this.context.actionLog.push({
          blockId: this.block.blockId,
          actionName,
          response: results,
          ts: new Date(),
          status: 'error',
        });
        this.actions[actionName].loading = false;
        this.block.update = true;
        this.context.update();
        loader();
        return results;
      });
  }

  registerAction(actionName, actionDefinition) {
    this.actions[actionName] = {
      loading: false,
      calls: [],
      call: this.createCall(actionDefinition),
      actionName,
    };
  }
}

export default BlockActions;
