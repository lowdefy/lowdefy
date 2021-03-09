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
import actions from './actions/index.js';

class Actions {
  constructor(context) {
    this.context = context;
    this.callAction = this.callAction.bind(this);
    this.callActions = this.callActions.bind(this);
    this.displayMessage = this.displayMessage.bind(this);
    this.actions = actions;
  }

  async callActions({ actions, arrayIndices, block, event, eventName }) {
    const responses = [];
    let success = true;
    try {
      for (const action of actions) {
        const response = await this.callAction({ action, arrayIndices, block, event });
        responses.push(response);
      }
    } catch (error) {
      responses.push(error);
      console.log(error);
      success = false;
    }
    return {
      blockId: block.blockId,
      event,
      eventName,
      responses,
      timestamp: new Date(),
      success,
    };
  }

  async callAction({ action, arrayIndices, block, event }) {
    if (!actions[action.type]) {
      throw {
        actionId: action.id,
        actionType: action.type,
        error: new Error(`Invalid action type "${action.type}" at "${block.blockId}".`),
      };
    }
    const { output: parsedAction, errors: parserErrors } = this.context.parser.parse({
      event,
      arrayIndices,
      input: action,
      location: block.blockId,
    });
    if (parserErrors.length > 0) {
      throw {
        actionId: action.id,
        actionType: action.type,
        error: parserErrors[0],
      };
    }
    if (parsedAction.skip === true) {
      return { actionId: action.id, actionType: action.type, skipped: true };
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
      response = await actions[action.type]({
        arrayIndices,
        context: this.context,
        event,
        params: parsedAction.params,
      });
    } catch (error) {
      closeLoading();
      this.displayMessage({
        defaultMessage: error.lowdefyMessage || 'Action unsuccessful',
        duration: 6,
        hideExplicitly: true,
        message: messages.error,
        status: 'error',
      });
      throw {
        actionId: action.id,
        actionType: action.type,
        error,
      };
    }
    closeLoading();
    this.displayMessage({
      defaultMessage: 'Success',
      message: messages.success,
      status: 'success',
    });
    return { actionId: action.id, actionType: action.type, response };
  }

  displayMessage({ defaultMessage, duration, hideExplicitly, message, status }) {
    let close = () => undefined;

    if ((hideExplicitly && message !== false) || (!hideExplicitly && !type.isNone(message))) {
      close = this.context.lowdefy.displayMessage({
        content: type.isString(message) ? message : defaultMessage,
        duration,
        status,
      });
    }
    return close;
  }
}

export default Actions;
