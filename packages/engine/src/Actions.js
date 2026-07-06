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

import { ActionError, ConfigError, UserError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';
import getActionMethods from './actions/getActionMethods.js';

const CONTROL_KEYS = [':if', ':switch', ':return'];

function isControl(item) {
  return type.isObject(item) && CONTROL_KEYS.some((key) => key in item);
}

class Actions {
  constructor(context) {
    this.context = context;
    this.callAction = this.callAction.bind(this);
    this.callActionLoop = this.callActionLoop.bind(this);
    this.callActions = this.callActions.bind(this);
    this.callControl = this.callControl.bind(this);
    this.displayMessage = this.displayMessage.bind(this);
    this.logActionError = this.logActionError.bind(this);
    this.actions = context._internal.lowdefy._internal.actions;
    this.loggedActionErrors = new Set();
  }

  logActionError({ error, action }) {
    const handleError = this.context._internal.lowdefy._internal.handleError;
    const actionId = action?.id || '';

    // Deduplicate by error message + action id
    const errorKey = `${error?.message || ''}:${actionId}`;
    if (this.loggedActionErrors.has(errorKey)) {
      return;
    }
    this.loggedActionErrors.add(errorKey);

    // User-facing errors log to browser console only, never to terminal
    if (error instanceof UserError) {
      this.context._internal.lowdefy._internal.logger.error(error);
      return;
    }

    // Lowdefy errors - use handleError (-> terminal)
    if (handleError) {
      handleError(error);
    }
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

  // Returns true when a ':return' control ended the list, so callers can end the event.
  async callActionLoop({
    actions,
    arrayIndices,
    block,
    controls,
    counters,
    event,
    progress,
    responses,
  }) {
    for (const [position, action] of actions.entries()) {
      if (isControl(action)) {
        const returned = await this.callControl({
          arrayIndices,
          block,
          control: action,
          controls,
          counters,
          event,
          progress,
          responses,
        });
        if (returned === true) {
          this.recordSkippedActions({ actions: actions.slice(position + 1), counters, responses });
          return true;
        }
        continue;
      }
      const index = counters.action;
      counters.action += 1;
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
    return false;
  }

  async callControl({
    arrayIndices,
    block,
    control,
    controls,
    counters,
    event,
    progress,
    responses,
  }) {
    const index = counters.control;
    counters.control += 1;
    if (':return' in control) {
      const value = this.evaluateControlValue({
        arrayIndices,
        block,
        event,
        input: control[':return'],
        node: control,
        responses,
      });
      controls.push({ index, type: ':return', taken: value });
      return true;
    }
    if (':if' in control) {
      const condition = this.evaluateControlValue({
        arrayIndices,
        block,
        event,
        input: control[':if'],
        node: control,
        responses,
      });
      // JS truthiness, matching the routine ':if' - not skip's strict === true.
      if (condition) {
        controls.push({ index, type: ':if', taken: 'then' });
        const returned = await this.callActionLoop({
          actions: control[':then'],
          arrayIndices,
          block,
          controls,
          counters,
          event,
          progress,
          responses,
        });
        this.recordSkippedActions({ actions: control[':else'] ?? [], counters, responses });
        return returned;
      }
      controls.push({ index, type: ':if', taken: 'else' });
      this.recordSkippedActions({ actions: control[':then'], counters, responses });
      return this.callActionLoop({
        actions: control[':else'] ?? [],
        arrayIndices,
        block,
        controls,
        counters,
        event,
        progress,
        responses,
      });
    }
    // ':switch' - cases are evaluated in order and lazily: the first truthy ':case' wins,
    // later cases are never evaluated, matching the routine ':switch'.
    let matched = false;
    let returned = false;
    for (const [casePosition, caseObject] of control[':switch'].entries()) {
      if (!matched) {
        const condition = this.evaluateControlValue({
          arrayIndices,
          block,
          event,
          input: caseObject[':case'],
          node: caseObject,
          responses,
        });
        if (condition) {
          matched = true;
          controls.push({ index, type: ':switch', taken: casePosition });
          returned = await this.callActionLoop({
            actions: caseObject[':then'],
            arrayIndices,
            block,
            controls,
            counters,
            event,
            progress,
            responses,
          });
          continue;
        }
      }
      this.recordSkippedActions({ actions: caseObject[':then'], counters, responses });
    }
    if (matched) {
      this.recordSkippedActions({ actions: control[':default'] ?? [], counters, responses });
      return returned;
    }
    controls.push({ index, type: ':switch', taken: 'default' });
    return this.callActionLoop({
      actions: control[':default'] ?? [],
      arrayIndices,
      block,
      controls,
      counters,
      event,
      progress,
      responses,
    });
  }

  evaluateControlValue({ arrayIndices, block, event, input, node, responses }) {
    const { output, errors: parserErrors } = this.context._internal.parser.parse({
      actions: responses,
      event,
      arrayIndices,
      input,
      location: block.blockId,
    });
    if (parserErrors.length > 0) {
      const error = parserErrors[0];
      // Report against the nearest node's '~k' when the operator carries none.
      if (!error.configKey) {
        error.configKey = node['~k'];
      }
      // Controls are anonymous - no responses entry, so only {error} is thrown.
      throw { error };
    }
    return output;
  }

  // Records actions the chain does not execute for a control-flow reason as skipped,
  // without parsing their operators. Controls record no responses entry, but still
  // consume a control index so reached controls keep their depth-first numbering.
  recordSkippedActions({ actions, counters, responses }) {
    for (const action of actions) {
      if (isControl(action)) {
        counters.control += 1;
        if (':if' in action) {
          this.recordSkippedActions({ actions: action[':then'], counters, responses });
          this.recordSkippedActions({ actions: action[':else'] ?? [], counters, responses });
        }
        if (':switch' in action) {
          action[':switch'].forEach((caseObject) => {
            this.recordSkippedActions({ actions: caseObject[':then'], counters, responses });
          });
          this.recordSkippedActions({ actions: action[':default'] ?? [], counters, responses });
        }
        continue;
      }
      responses[action.id] = { type: action.type, skipped: true, index: counters.action };
      counters.action += 1;
    }
  }

  async callActions({ actions, arrayIndices, block, catchActions, event, eventName, progress }) {
    const startTimestamp = new Date();
    const responses = {};
    // Only events with controls gain a 'controls' array - flat chains keep their result shape.
    const hasControls = actions.some(isControl) || catchActions.some(isControl);
    const controls = hasControls ? [] : undefined;
    const counters = { action: 0, control: 0 };
    try {
      await this.callActionLoop({
        actions,
        arrayIndices,
        block,
        controls,
        counters,
        event,
        responses,
        progress,
      });
    } catch (error) {
      this.logActionError(error);
      // Catch actions restart action numbering, matching flat-chain history; the control
      // counter continues so every control entry keeps a unique index within the event.
      counters.action = 0;
      try {
        await this.callActionLoop({
          actions: catchActions,
          arrayIndices,
          block,
          controls,
          counters,
          event,
          responses,
          progress,
        });
      } catch (errorCatch) {
        this.logActionError(errorCatch);
        return {
          blockId: block.blockId,
          bounced: false,
          ...(controls && { controls }),
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
        ...(controls && { controls }),
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
      ...(controls && { controls }),
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
      const error = new ConfigError(`Invalid action type "${action.type}" at "${block.blockId}".`, {
        configKey: action['~k'],
      });
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
    const t = this.context._internal.lowdefy._internal.translate;
    let response;
    const closeLoading = this.displayMessage({
      defaultMessage: t('engine.action.loading'),
      duration: 0,
      message: messages.loading,
      status: 'loading',
    });
    try {
      response = await this.actions[action.type]({
        globals: this.context._internal.lowdefy._internal.globals,
        methods: getActionMethods({
          actionId: action.id,
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
      const error = err.isLowdefyError
        ? err
        : new ActionError(err.message, {
            cause: err,
            typeName: action.type,
            received: parsedAction.params,
            location: block.blockId,
            configKey: action['~k'],
          });

      responses[action.id] = { error, index, type: action.type };
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
      throw { error, action, index };
    }
    closeLoading();
    this.displayMessage({
      defaultMessage: t('engine.action.success'),
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
