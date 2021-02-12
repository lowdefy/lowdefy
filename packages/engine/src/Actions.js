/* eslint-disable camelcase */
/* eslint-disable prefer-promise-reject-errors */

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

import { applyArrayIndices, get, serializer, set, type, urlQuery } from '@lowdefy/helpers';

import makeContextId from './makeContextId';

class Actions {
  constructor(context) {
    this.context = context;

    this.build = this.build.bind(this);
    this.callMethod = this.callMethod.bind(this);
    this.request = this.request.bind(this);
    this.link = this.link.bind(this);
    this.message = this.message.bind(this);
    this.reset = this.reset.bind(this);
    this.scrollTo = this.scrollTo.bind(this);
    this.setGlobal = this.setGlobal.bind(this);
    this.setState = this.setState.bind(this);
    this.validate = this.validate.bind(this);

    this.actions = {
      CallMethod: this.callMethod,
      Request: this.request,
      Link: this.link,
      Message: this.message,
      Reset: this.reset,
      ScrollTo: this.scrollTo,
      SetGlobal: this.setGlobal,
      SetState: this.setState,
      Validate: this.validate,
    };
  }

  static invalidAction(action) {
    return () =>
      Promise.reject({
        errorMessage: action.error || 'Invalid action',
        error: new Error(`Invalid action: ${JSON.stringify(action)}`),
      });
  }

  build(actions) {
    return actions.map((action) => ({
      ...action,
      fn: ({ event, arrayIndices, blockId }) =>
        get(this.actions, action.type, { default: Actions.invalidAction(action) })(
          action.params,
          action.success,
          action.error,
          event,
          arrayIndices,
          blockId
        ),
    }));
  }

  reset(_, successMessage, errorMessage) {
    try {
      this.context.State.resetState();
      this.context.RootBlocks.reset(
        serializer.deserializeFromString(this.context.State.frozenState)
      );
      this.context.update();
      // Consider firing onReset and onResetAsync actions
    } catch (error) {
      // log e
      return Promise.reject({ errorMessage: errorMessage || 'Failed to reset page.', error });
    }
  }

  async callMethod(params, successMessage, errorMessage, _, arrayIndices) {
    // TODO: add callMethod on block and use instead
    try {
      const { blockId, method, args } = params;
      const blockMethod = this.context.RootBlocks.map[applyArrayIndices(arrayIndices, blockId)]
        .methods[method];
      let response;
      if (type.isArray(args)) {
        response = await blockMethod(...args);
      } else {
        response = await blockMethod(args);
      }
      return { successMessage, response };
    } catch (error) {
      // log e
      return Promise.reject({ errorMessage: errorMessage || 'Failed to callMethod.', error });
    }
  }

  request(params, successMessage, errorMessage, event, arrayIndices) {
    if (type.isNone(params)) {
      // Should this resolve or error
      return Promise.resolve();
    }
    if (params.all === true) {
      return this.context.Requests.callRequests({ event, arrayIndices })
        .then((response) => ({ successMessage, response }))
        .catch((error) => {
          if (errorMessage) {
            return Promise.reject({ errorMessage, error });
          }
          try {
            const { displayTitle, displayMessage } = error.graphQLErrors[0].extensions;
            return Promise.reject({ errorMessage: `${displayTitle}: ${displayMessage}`, error });
          } catch (e) {
            // Not a graphQLError, displayTitle, displayMessage do not exist
          }
          return Promise.reject({ errorMessage: error.message, error });
        });
    }
    if (type.isString(params)) {
      return this.context.Requests.callRequest({ requestId: params, event, arrayIndices })
        .then((response) => ({ successMessage, response }))
        .catch((error) => {
          if (errorMessage) {
            return Promise.reject({ errorMessage, error });
          }
          try {
            const { displayTitle, displayMessage } = error.graphQLErrors[0].extensions;
            return Promise.reject({ errorMessage: `${displayTitle}: ${displayMessage}`, error });
          } catch (e) {
            // Not a graphQLError, displayTitle, displayMessage do not exist
          }
          return Promise.reject({ errorMessage: error.message, error });
        });
    }
    if (type.isArray(params)) {
      return this.context.Requests.callRequests({ requestIds: params, event, arrayIndices })
        .then((response) => ({ successMessage, response }))
        .catch((error) => {
          if (errorMessage) {
            return Promise.reject({ errorMessage, error });
          }
          try {
            const { displayTitle, displayMessage } = error.graphQLErrors[0].extensions;
            return Promise.reject({ errorMessage: `${displayTitle}: ${displayMessage}`, error });
          } catch (e) {
            // Not a graphQLError, displayTitle, displayMessage do not exist
          }
          return Promise.reject({ errorMessage: error.message, error });
        });
    }
    return Promise.reject({
      errorMessage: errorMessage || `Failed to call request.`,
      error: new Error(`Invalid _request params: ${params}`),
    });
  }

  message(params = {}, successMessage, errorMessage, event, arrayIndices, blockId) {
    try {
      const { output: parsed, errors: parseErrors } = this.context.parser.parse({
        event,
        arrayIndices,
        input: params,
        location: blockId,
      });
      if (parseErrors.length > 0) {
        return Promise.reject({
          errorMessage: errorMessage || `Message failed.`,
          error: parseErrors,
        });
      }
      this.context.displayMessage[parsed.status || 'success']({
        content: parsed.content || 'Success',
        duration: type.isNone(parsed.duration) ? 5 : parsed.duration,
      });
      return Promise.resolve({ successMessage });
    } catch (error) {
      return Promise.reject({
        errorMessage: errorMessage || `Message failed.`,
        error,
      });
    }
  }

  setState(value, successMessage, errorMessage, event, arrayIndices, blockId) {
    try {
      const { output: parsed, errors: stateParseErrors } = this.context.parser.parse({
        event,
        arrayIndices,
        input: value,
        location: blockId,
      });
      if (stateParseErrors.length > 0) {
        return Promise.reject({
          errorMessage: errorMessage || 'Failed to set state due to parser error.',
          error: stateParseErrors,
        });
      }
      Object.keys(parsed).forEach((key) => {
        this.context.State.set(applyArrayIndices(arrayIndices, key), parsed[key]);
      });
      this.context.RootBlocks.reset();
      this.context.update();
    } catch (error) {
      // log e
      return Promise.reject({ errorMessage: errorMessage || 'Failed to set state.', error });
    }
    return Promise.resolve({ successMessage });
  }

  setGlobal(value, successMessage, errorMessage, event, arrayIndices, blockId) {
    try {
      const { output: parsed, errors: globalParseErrors } = this.context.parser.parse({
        event,
        arrayIndices,
        input: value,
        location: blockId,
      });
      if (globalParseErrors.length > 0) {
        return Promise.reject({
          errorMessage: errorMessage || 'Failed to set global due to parser error.',
          error: globalParseErrors,
        });
      }
      Object.keys(parsed).forEach((key) => {
        set(this.context.lowdefyGlobal, applyArrayIndices(arrayIndices, key), parsed[key]);
      });
      this.context.RootBlocks.reset();
      this.context.update();
    } catch (error) {
      // log e
      return Promise.reject({ errorMessage: errorMessage || 'Failed to set global.', error });
    }
    return Promise.resolve({ successMessage });
  }

  scrollTo(params, successMessage, errorMessage, event, arrayIndices, blockId) {
    const { output: parsedParams, errors: parserErrors } = this.context.parser.parse({
      event,
      arrayIndices,
      input: params,
      location: blockId,
    });
    if (parserErrors.length > 0) {
      return Promise.reject({
        errorMessage: errorMessage || 'Failed to scroll due to parser error.',
        error: parserErrors,
      });
    }
    try {
      if (parsedParams) {
        if (parsedParams.blockId) {
          const element = this.context.document.getElementById(parsedParams.blockId);
          if (element) {
            element.scrollIntoView(parsedParams.options);
          }
        } else {
          this.context.window.scrollTo(parsedParams);
        }
      }
    } catch (error) {
      return Promise.reject({ errorMessage: errorMessage || 'Failed to scroll.', error });
    }
    return Promise.resolve({ successMessage });
  }

  link(params, successMessage, errorMessage, event, arrayIndices, blockId) {
    const { output: parsedParams, errors: parserErrors } = this.context.parser.parse({
      event,
      arrayIndices,
      input: params,
      location: blockId,
    });
    if (parserErrors.length > 0) {
      return Promise.reject({
        errorMessage: errorMessage || 'Failed to follow page link due to parser error.',
        error: parserErrors,
      });
    }
    try {
      const lowdefyUrlQuery = type.isNone(parsedParams.urlQuery)
        ? ''
        : `?${urlQuery.stringify(parsedParams.urlQuery)}`;

      let pageId;
      if (type.isString(parsedParams)) {
        // eslint-disable-next-line no-const-assign
        pageId = parsedParams;
      }
      if (parsedParams.pageId) {
        pageId = parsedParams.pageId;
      }
      if (pageId) {
        // set input for page before changing
        if (!type.isNone(parsedParams.input)) {
          const nextContextId = makeContextId({
            pageId,
            search: parsedParams.urlQuery,
            blockId: pageId,
          });
          this.context.allInputs[nextContextId] = parsedParams.input;
        }
        if (parsedParams.newTab) {
          this.context.window
            .open(`${this.context.window.location.origin}/${pageId}${lowdefyUrlQuery}`, '_blank')
            .focus();
        } else {
          this.context.routeHistory.push(`/${pageId}${lowdefyUrlQuery}`);
        }
      } else if (parsedParams.url) {
        if (parsedParams.newTab) {
          this.context.window.open(`${parsedParams.url}${lowdefyUrlQuery}`, '_blank').focus();
        } else {
          this.context.window.location.href = `${parsedParams.url}${lowdefyUrlQuery}`;
        }
      } else if (parsedParams.home) {
        if (parsedParams.newTab) {
          this.context.window
            .open(`${this.context.window.location.origin}/${lowdefyUrlQuery}`, '_blank')
            .focus();
        } else {
          this.context.routeHistory.push(`/${lowdefyUrlQuery}`);
        }
      }
    } catch (error) {
      return Promise.reject({ errorMessage: errorMessage || 'Failed to follow link.', error });
    }
    return Promise.resolve({ successMessage });
  }

  validate(params, successMessage, errorMessage) {
    try {
      if (!type.isNone(params) && !type.isString(params) && !type.isArray(params)) {
        throw new Error('Invalid validate params.');
      }
      this.context.showValidationErrors = true;
      let validationErrors = this.context.RootBlocks.validate();
      if (params) {
        const blockIds = type.isString(params) ? [params] : params;
        validationErrors = validationErrors.filter((block) => {
          return blockIds.includes(block.blockId);
        });
      }

      if (validationErrors.length > 0) {
        return Promise.reject({
          errorMessage:
            errorMessage ||
            `Your input has ${validationErrors.length} validation error${
              validationErrors.length !== 1 ? 's' : ''
            }.`,
        });
      }
    } catch (error) {
      return Promise.reject({ errorMessage: 'Failed to validate page input.', error });
    }
    return Promise.resolve({ successMessage });
  }
}

export default Actions;
