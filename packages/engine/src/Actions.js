/* eslint-disable camelcase */
/* eslint-disable prefer-promise-reject-errors */

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

import { applyArrayIndices, urlQuery } from '@lowdefy/helpers';
import type from '@lowdefy/type';
import get from '@lowdefy/get';
import set from '@lowdefy/set';
import serializer from '@lowdefy/serializer';
import gql from 'graphql-tag';

import makeContextId from './makeContextId';

const UPDATE_USER_PROFILE = gql`
  mutation updateUserProfile($updateUserProfileInput: UpdateUserProfileInput!) {
    updateUserProfile(updateUserProfileInput: $updateUserProfileInput) {
      success
    }
  }
`;

const REFRESH_USER = gql`
  query refreshUser {
    user {
      id
      email
      phone_number
      given_name
      family_name
      name
      nickname
      picture
      preferred_username
      attributes
      groupIds
      roles
      adminGroupIds
      allPageIds
    }
  }
`;

class Actions {
  constructor(context) {
    this.context = context;

    this.build = this.build.bind(this);
    this.callMethod = this.callMethod.bind(this);
    this.fetch = this.fetch.bind(this);
    this.getCliToken = this.getCliToken.bind(this);
    this.link = this.link.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.message = this.message.bind(this);
    this.mutate = this.mutate.bind(this);
    this.notification = this.notification.bind(this);
    this.reset = this.reset.bind(this);
    this.scrollTo = this.scrollTo.bind(this);
    this.setGlobal = this.setGlobal.bind(this);
    this.setState = this.setState.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.validate = this.validate.bind(this);

    this.actions = {
      CallMethod: this.callMethod,
      Fetch: this.fetch,
      GetCliToken: this.getCliToken,
      Link: this.link,
      Login: this.login,
      Logout: this.logout,
      Message: this.message,
      Mutate: this.mutate,
      Notification: this.notification,
      Reset: this.reset,
      ScrollTo: this.scrollTo,
      SetGlobal: this.setGlobal,
      SetState: this.setState,
      UpdateProfile: this.updateProfile,
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
      fn: ({ args, arrayIndices, blockId }) =>
        get(this.actions, action.type, { default: Actions.invalidAction(action) })(
          action.params,
          action.success,
          action.error,
          args,
          arrayIndices,
          blockId
        ),
    }));
  }

  mutate(mutationId, successMessage, errorMessage, args, arrayIndices) {
    if (type.isString(mutationId)) {
      return this.context.Mutations.callMutation({
        mutationId,
        args,
        arrayIndices,
      })
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
      errorMessage: errorMessage || `Failed to fetch.`,
      error: new Error(`Invalid mutation id: ${mutationId}`),
    });
  }

  reset(_, successMessage, errorMessage) {
    try {
      this.context.State.resetState();
      this.context.RootBlocks.reset(
        serializer.deserializeFromString(this.context.State.frozenState)
      );
      this.context.update();
      // Fetch all requests
      return this.fetch(undefined, successMessage, errorMessage);
    } catch (error) {
      // log e
      return Promise.reject({ errorMessage: errorMessage || 'Failed to reset page.', error });
    }
  }

  async callMethod(params, successMessage, errorMessage, _, arrayIndices) {
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

  async getCliToken(_, successMessage, errorMessage) {
    try {
      const response = await this.context.appGraphql.getCliToken();
      console.log('CLI TOKEN:');
      console.log(response);
      try {
        navigator.clipboard.writeText(response);
      } catch (error) {
        console.error(error);
      }
      return { successMessage, response };
    } catch (error) {
      // log e
      return Promise.reject({ errorMessage: errorMessage || 'Failed to get cli token.', error });
    }
  }

  fetch(params, successMessage, errorMessage) {
    if (type.isNone(params)) {
      return this.context.Requests.callRequests()
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
      return this.context.Requests.callRequest({ requestId: params })
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
      return this.context.Requests.callRequests({ requestIds: params })
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
      errorMessage: errorMessage || `Failed to fetch.`,
      error: new Error(`Invalid _request params: ${params}`),
    });
  }

  notification(params = {}, successMessage, errorMessage, args, arrayIndices, blockId) {
    try {
      const { output: parsed, errors: parseErrors } = this.context.parser.parse({
        args,
        arrayIndices,
        input: params,
        location: blockId,
      });
      if (parseErrors.length > 0) {
        return Promise.reject({
          errorMessage: errorMessage || `Notification failed.`,
          error: parseErrors,
        });
      }
      this.context.displayNotification[parsed.status || 'success']({
        bottom: parsed.bottom,
        description: parsed.description || '',
        duration: type.isNone(parsed.duration) ? 5 : parsed.duration,
        message: parsed.message || 'Success',
        placement: parsed.placement,
        top: parsed.top,
      });
      return Promise.resolve({ successMessage });
    } catch (error) {
      return Promise.reject({
        errorMessage: errorMessage || `Notification failed.`,
        error,
      });
    }
  }

  message(params = {}, successMessage, errorMessage, args, arrayIndices, blockId) {
    try {
      const { output: parsed, errors: parseErrors } = this.context.parser.parse({
        args,
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

  setState(value, successMessage, errorMessage, args, arrayIndices, blockId) {
    try {
      const { output: parsed, errors: stateParseErrors } = this.context.parser.parse({
        args,
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

  setGlobal(value, successMessage, errorMessage, args, arrayIndices, blockId) {
    try {
      const { output: parsed, errors: globalParseErrors } = this.context.parser.parse({
        args,
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

  scrollTo(params, successMessage, errorMessage, args, arrayIndices, blockId) {
    const { output: parsedParams, errors: parserErrors } = this.context.parser.parse({
      args,
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

  link(params, successMessage, errorMessage, args, arrayIndices, blockId) {
    const { output: parsedParams, errors: parserErrors } = this.context.parser.parse({
      args,
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
            branch: this.context.branch,
            pageId,
            search: parsedParams.urlQuery,
            blockId: pageId,
          });
          this.context.allInputs[nextContextId] = parsedParams.input;
        }
        if (parsedParams.newWindow) {
          this.context.window
            .open(`${this.context.window.location.origin}/${pageId}${lowdefyUrlQuery}`, '_blank')
            .focus();
        } else {
          this.context.routeHistory.push(`/${pageId}${lowdefyUrlQuery}`);
        }
      } else if (parsedParams.url) {
        if (parsedParams.newWindow) {
          this.context.window.open(`${parsedParams.url}${lowdefyUrlQuery}`, '_blank').focus();
        } else {
          this.context.window.location.href = `${parsedParams.url}${lowdefyUrlQuery}`;
        }
      } else if (parsedParams.home) {
        if (parsedParams.newWindow) {
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

  logout(_, successMessage, errorMessage) {
    try {
      this.context.localStore.setItem(`token:${this.context.branch}`, '');
      if (this.context.openidLogoutUrl) {
        this.context.window.location.href = this.context.openidLogoutUrl;
      } else {
        this.context.window.location.href = this.context.window.location.origin;
      }
    } catch (error) {
      return Promise.reject({ errorMessage: errorMessage || 'Failed to logout.', error });
    }
    return Promise.resolve({ successMessage });
  }

  login(_, successMessage, errorMessage) {
    try {
      this.context.routeHistory.push(`/login`);
    } catch (error) {
      return Promise.reject({ errorMessage: errorMessage || 'Failed login redirect.', error });
    }
    return Promise.resolve({ successMessage });
  }

  updateProfile(userUpdate, successMessage, errorMessage, args, arrayIndices, blockId) {
    try {
      const { output: parsedUserUpdate, errors: userParseErrors } = this.context.parser.parse({
        args,
        arrayIndices,
        input: userUpdate,
        location: blockId,
      });
      if (userParseErrors.length > 0) {
        return Promise.reject({
          errorMessage: errorMessage || 'Failed to update profile due to parser error.',
          error: userParseErrors,
        });
      }
      const {
        id,
        phone_number,
        name,
        family_name,
        given_name,
        nickname,
        picture,
        preferred_username,
        attributes,
      } = parsedUserUpdate;
      return this.context.client
        .mutate({
          mutation: UPDATE_USER_PROFILE,
          variables: {
            updateUserProfileInput: {
              userId: id,
              phone_number,
              name,
              family_name,
              given_name,
              nickname,
              picture,
              preferred_username,
              attributes,
            },
          },
          // refetch user query
          // TODO: Apollo cache does not update if user is returned by mutation
          // Maybe Apollo client V3 will fix this?
          refetchQueries: [{ query: REFRESH_USER }],
          awaitRefetchQueries: true,
        })
        .then(() => {
          return { successMessage };
        })
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
    } catch (error) {
      // log e
      return Promise.reject({ errorMessage: errorMessage || 'Failed to update profile.', error });
    }
  }

  validate(blockId, successMessage, errorMessage) {
    try {
      this.context.showValidationErrors = true;
      let validationErrors = this.context.RootBlocks.validate();
      if (type.isString(blockId)) {
        validationErrors = validationErrors.filter((block) => {
          return block.blockId === blockId;
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
