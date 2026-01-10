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
import getActionMethods from './actions/getActionMethods.js';

class Actions {
  constructor(context) {
    this.context = context;
    this.callAction = this.callAction.bind(this);
    this.callActionLoop = this.callActionLoop.bind(this);
    this.callActions = this.callActions.bind(this);
    this.displayMessage = this.displayMessage.bind(this);
    this.logActionError = this.logActionError.bind(this);
    this.actions = context._internal.lowdefy._internal.actions;
    this.loggedActionErrors = new Set();
  }

  // Log action errors appropriately:
  // - Operator errors (have configKey): use logError for config tracing
  // - Throw errors: log as regular error (intentional, no config trace)
  // - Other errors: log as regular error
  logActionError({ error, action }) {
    const logError = this.context._internal.lowdefy._internal.logError;
    const actionId = action?.id || '';

    // Deduplicate by error message + action id
    const errorKey = `${error?.message || ''}:${actionId}`;
    if (this.loggedActionErrors.has(errorKey)) {
      return;
    }
    this.loggedActionErrors.add(errorKey);

    // Throw errors are intentional - don't log config location
    if (action?.type === 'Throw' || error?.name === 'ThrowError') {
      console.error(`[Throw Action] ${error?.message || 'Action error'}`);
      return;
    }

    // Operator errors have configKey - use logError for config tracing
    if (error?.configKey && logError) {
      logError(error);
      return;
    }

    // Other errors - log with action type
    const actionType = action?.type || 'Unknown';
    console.error(`[${actionType} Action] ${error?.message || 'Action error'}`);
  }

  async callAsyncAction({ action, arrayIndices, block, event, index, responses }) {
    try {
      const response = await this.callAction({
        action,
        arrayIndices,
        block,
        event,
        index,
        responses,
      });
      responses[action.id] = response;
    } catch (err) {
      // err is already {error, action, index} from callAction
      responses[action.id] = err;
      this.logActionError(err);
    }
  }

  async callActionLoop({ actions, arrayIndices, block, event, progress, responses }) {
    for (const [index, action] of actions.entries()) {
      try {
        if (action.async === true) {
          this.callAsyncAction({
            action,
            arrayIndices,
            block,
            event,
            index,
            progress,
            responses,
          });
        } else {
          const response = await this.callAction({
            action,
            arrayIndices,
            block,
            event,
            index,
            progress,
            responses,
          });
          responses[action.id] = response;
        }
      } catch (err) {
        // err is already {error, action, index} from callAction
        responses[action.id] = err;
        throw err;
      }
    }
  }

  async callActions({ actions, arrayIndices, block, catchActions, event, eventName, progress }) {
    const startTimestamp = new Date();
    const responses = {};
    try {
      await this.callActionLoop({ actions, arrayIndices, block, event, responses, progress });
    } catch (error) {
      this.logActionError(error);
      try {
        await this.callActionLoop({
          actions: catchActions,
          arrayIndices,
          block,
          event,
          responses,
          progress,
        });
      } catch (errorCatch) {
        this.logActionError(errorCatch);
        return {
          blockId: block.blockId,
          bounced: false,
          endTimestamp: new Date(),
          error,
          errorCatch,
          event,
          eventName,
          responses,
          startTimestamp,
          success: false,
        };
      }
      return {
        blockId: block.blockId,
        bounced: false,
        endTimestamp: new Date(),
        error,
        event,
        eventName,
        responses,
        startTimestamp,
        success: false,
      };
    }
    return {
      blockId: block.blockId,
      bounced: false,
      endTimestamp: new Date(),
      event,
      eventName,
      responses,
      startTimestamp,
      success: true,
    };
  }

  async callAction({ action, arrayIndices, block, event, index, progress, responses }) {
    if (!this.actions[action.type]) {
      const error = new Error(`Invalid action type "${action.type}" at "${block.blockId}".`);
      // Attach action's configKey so error can be traced to config
      error.configKey = action['~k'];
      throw { error, action, index };
    }
    const { output: parsedAction, errors: parserErrors } = this.context._internal.parser.parse({
      actions: responses,
      event,
      arrayIndices,
      input: action,
      location: block.blockId,
    });
    if (parserErrors.length > 0) {
      // Parser errors already have configKey from operator
      throw { error: parserErrors[0], action, index };
    }
    if (parsedAction.skip === true) {
      return { type: action.type, skipped: true, index };
    }
    const messages = parsedAction.messages || {};
    let response;
    const closeLoading = this.displayMessage({
      defaultMessage: 'Loading',
      duration: 0,
      message: messages.loading,
      status: 'loading',
    });
    try {
      response = await this.actions[action.type]({
        globals: this.context._internal.lowdefy._internal.globals,
        methods: getActionMethods({
          actions: responses,
          arrayIndices,
          blockId: block.blockId,
          context: this.context,
          event,
        }),
        params: parsedAction.params,
      });
      if (progress) {
        progress();
      }
    } catch (err) {
      responses[action.id] = { error: err, index, type: action.type };
      const { output: parsedMessages, errors: parserErrors } = this.context._internal.parser.parse({
        actions: responses,
        event,
        arrayIndices,
        input: action.messages,
        location: block.blockId,
      });
      if (parserErrors.length > 0) {
        // this condition is very unlikely since parser errors usually occur in the first parse.
        throw { error: parserErrors[0], action, index };
      }
      closeLoading();
      this.displayMessage({
        defaultMessage: err.message,
        duration: 6,
        hideExplicitly: true,
        message: (parsedMessages || {}).error,
        status: 'error',
      });
      // Don't attach configKey to action errors (e.g. Throw) - they are intentional
      throw { error: err, action, index };
    }
    closeLoading();
    this.displayMessage({
      defaultMessage: 'Success',
      message: messages.success,
      status: 'success',
    });
    return { type: action.type, response, index };
  }

  displayMessage({ defaultMessage, duration, hideExplicitly, message, status }) {
    let close = () => undefined;
    if ((hideExplicitly && message !== false) || (!hideExplicitly && !type.isNone(message))) {
      close = this.context._internal.lowdefy._internal.displayMessage({
        content: type.isString(message) ? message : defaultMessage,
        duration,
        status,
      });
    }
    return close;
  }
}

export default Actions;
