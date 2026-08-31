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

import { isReserved, type } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import createCheckDuplicateId from '../../../utils/createCheckDuplicateId.js';

const BROWSER_DEFAULT_SHORTCUTS = new Set(['mod+n', 'mod+t', 'mod+w', 'mod+r', 'mod+q', 'mod+l']);

const CONTROL_KEYS = [':if', ':switch', ':return'];
const ACTION_KEYS_NOT_ALLOWED_ON_CONTROLS = ['id', 'skip', 'messages'];
const CONTROL_ALLOWED_KEYS = {
  ':if': [':if', ':then', ':else'],
  ':return': [':return'],
  ':switch': [':switch', ':default'],
};
const CASE_ALLOWED_KEYS = [':case', ':then'];

// '~'-prefixed keys are build meta markers (~k, ~r, ~l, ~ignoreBuildChecks) and
// never user config - tolerate them by prefix, as the rest of the build does.
function isMetaKey(key) {
  return key.startsWith('~');
}

function isControl(item) {
  return type.isObject(item) && CONTROL_KEYS.some((key) => key in item);
}

function checkAction(
  action,
  {
    blockId,
    callApiActionRefs,
    checkDuplicateActionId,
    eventId,
    linkActionRefs,
    pageId,
    requestActionRefs,
    typeCounters,
    websocketActionRefs,
  }
) {
  const configKey = action['~k'];
  if (type.isUndefined(action.id)) {
    throw new ConfigError(
      `Action id missing on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
      { configKey }
    );
  }
  if (!type.isString(action.id)) {
    throw new ConfigError(
      `Action id is not a string on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
      { received: action.id, configKey }
    );
  }
  checkDuplicateActionId({
    id: action.id,
    configKey,
    eventId,
    blockId,
    pageId,
  });
  if (!type.isString(action.type)) {
    throw new ConfigError(
      `Action type is not a string on action "${action.id}" on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
      { received: action.type, configKey }
    );
  }
  typeCounters.actions.increment(action.type, configKey);

  // Collect static Request action references for validation
  if (action.type === 'Request' && !type.isNone(action.params)) {
    const params = action.params;
    if (type.isString(params)) {
      requestActionRefs.push({ requestId: params, action, blockId, eventId });
    } else if (type.isArray(params)) {
      params.forEach((param) => {
        if (type.isString(param)) {
          requestActionRefs.push({ requestId: param, action, blockId, eventId });
        }
      });
    }
  }

  // Collect static Link action references for validation
  if (action.type === 'Link' && !type.isNone(action.params)) {
    const params = action.params;
    // Link params can be a string (pageId) or object with pageId property
    if (type.isString(params)) {
      linkActionRefs.push({ pageId: params, action, blockId, eventId, sourcePageId: pageId });
    } else if (type.isObject(params) && type.isString(params.pageId)) {
      linkActionRefs.push({
        pageId: params.pageId,
        action,
        blockId,
        eventId,
        sourcePageId: pageId,
      });
    }
  }

  // Collect static CallAPI action references for validation
  if (action.type === 'CallAPI' && !type.isNone(action.params)) {
    const params = action.params;
    if (type.isObject(params) && type.isString(params.endpointId)) {
      callApiActionRefs.push({
        endpointId: params.endpointId,
        action,
        blockId,
        eventId,
        sourcePageId: pageId,
      });
    }
  }

  // Collect static Subscribe/Unsubscribe/Publish action references for validation
  if (['Subscribe', 'Unsubscribe'].includes(action.type) && type.isString(action.params)) {
    (websocketActionRefs ?? []).push({
      websocketId: action.params,
      action,
      actionType: action.type,
      blockId,
      eventId,
      sourcePageId: pageId,
    });
  }
  if (
    action.type === 'Publish' &&
    type.isObject(action.params) &&
    type.isString(action.params.websocketId)
  ) {
    (websocketActionRefs ?? []).push({
      websocketId: action.params.websocketId,
      action,
      actionType: action.type,
      blockId,
      eventId,
      sourcePageId: pageId,
    });
  }
}

function checkBranchList({ list, listName, configKey }, ctx) {
  const { blockId, eventId, pageId } = ctx;
  if (!type.isArray(list)) {
    throw new ConfigError(
      `Control "${listName}" must be an array on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
      { received: list, configKey }
    );
  }
  checkActionList(list, ctx);
}

function checkControl(control, ctx) {
  const { blockId, eventId, pageId } = ctx;
  const configKey = control['~k'];
  const controlKeys = CONTROL_KEYS.filter((key) => key in control);
  if (controlKeys.length > 1) {
    const keyList = controlKeys.map((key) => `"${key}"`).join(', ');
    throw new ConfigError(
      `Control has more than one control key (${keyList}) on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
      { received: controlKeys, configKey }
    );
  }
  const [controlKey] = controlKeys;
  const invalidKeys = Object.keys(control).filter(
    (key) => !CONTROL_ALLOWED_KEYS[controlKey].includes(key) && !isMetaKey(key)
  );
  if (invalidKeys.length > 0) {
    // Action keys do nothing on a control - call out the likely mistake directly.
    if (ACTION_KEYS_NOT_ALLOWED_ON_CONTROLS.includes(invalidKeys[0])) {
      throw new ConfigError(
        `Control "${controlKey}" can not have action property "${invalidKeys[0]}" on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
        { received: invalidKeys, configKey }
      );
    }
    throw new ConfigError(
      `Control "${controlKey}" has invalid key "${invalidKeys[0]}" on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
      { received: invalidKeys, configKey }
    );
  }
  if (controlKey === ':if') {
    if (type.isNone(control[':then'])) {
      throw new ConfigError(
        `Control ":if" requires a ":then" list on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
        { configKey }
      );
    }
    checkBranchList({ list: control[':then'], listName: ':then', configKey }, ctx);
    if (!type.isNone(control[':else'])) {
      checkBranchList({ list: control[':else'], listName: ':else', configKey }, ctx);
    }
  }
  if (controlKey === ':switch') {
    if (!type.isArray(control[':switch'])) {
      throw new ConfigError(
        `Control ":switch" must be an array of case objects on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
        { received: control[':switch'], configKey }
      );
    }
    control[':switch'].forEach((caseObject) => {
      if (!type.isObject(caseObject)) {
        throw new ConfigError(
          `Control ":switch" case must be an object on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
          { received: caseObject, configKey }
        );
      }
      const caseConfigKey = caseObject['~k'] ?? configKey;
      if (!(':case' in caseObject)) {
        throw new ConfigError(
          `Control ":switch" case requires a ":case" condition on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
          { configKey: caseConfigKey }
        );
      }
      if (type.isNone(caseObject[':then'])) {
        throw new ConfigError(
          `Control ":case" requires a ":then" list on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
          { configKey: caseConfigKey }
        );
      }
      const invalidCaseKeys = Object.keys(caseObject).filter(
        (key) => !CASE_ALLOWED_KEYS.includes(key) && !isMetaKey(key)
      );
      if (invalidCaseKeys.length > 0) {
        throw new ConfigError(
          `Control ":switch" case has invalid key "${invalidCaseKeys[0]}" on event "${eventId}" on block "${blockId}" on page "${pageId}".`,
          { received: invalidCaseKeys, configKey: caseConfigKey }
        );
      }
      checkBranchList(
        { list: caseObject[':then'], listName: ':then', configKey: caseConfigKey },
        ctx
      );
    });
    if (!type.isNone(control[':default'])) {
      checkBranchList({ list: control[':default'], listName: ':default', configKey }, ctx);
    }
  }
  // ':return' takes a value, not a list - nothing more to validate.
}

function checkActionList(list, ctx) {
  list.forEach((item) => {
    if (isControl(item)) {
      checkControl(item, ctx);
    } else {
      checkAction(item, ctx);
    }
  });
}

function buildEvents(block, pageContext) {
  if (block.events) {
    Object.keys(block.events).map((key) => {
      const eventConfigKey = block.events[key]?.['~k'] || block['~k'];
      if (
        (!type.isArray(block.events[key]) && !type.isObject(block.events[key])) ||
        (type.isObject(block.events[key]) && type.isNone(block.events[key].try))
      ) {
        throw new ConfigError(
          `Actions must be an array at "${block.blockId}" in event "${key}" on page "${pageContext.pageId}".`,
          { received: block.events[key]?.try, configKey: eventConfigKey }
        );
      }
      if (type.isArray(block.events[key])) {
        block.events[key] = {
          try: block.events[key],
          catch: [],
        };
      }
      if (!type.isArray(block.events[key].try)) {
        throw new ConfigError(
          `Try actions must be an array at "${block.blockId}" in event "${key}.try" on page "${pageContext.pageId}".`,
          { received: block.events[key].try, configKey: eventConfigKey }
        );
      }
      if (type.isNone(block.events[key].catch)) {
        block.events[key].catch = [];
      }
      if (!type.isArray(block.events[key].catch)) {
        throw new ConfigError(
          `Catch actions must be an array at "${block.blockId}" in event "${key}.catch" on page "${pageContext.pageId}".`,
          { received: block.events[key].catch, configKey: eventConfigKey }
        );
      }
      const checkDuplicateActionId = createCheckDuplicateId({
        message:
          'Duplicate actionId "{{ id }}" on event "{{ eventId }}" on block "{{ blockId }}" on page "{{ pageId }}".',
      });
      const actionContext = {
        eventId: key,
        blockId: block.blockId,
        callApiActionRefs: pageContext.callApiActionRefs,
        typeCounters: pageContext.typeCounters,
        pageId: pageContext.pageId,
        linkActionRefs: pageContext.linkActionRefs,
        requestActionRefs: pageContext.requestActionRefs,
        websocketActionRefs: pageContext.websocketActionRefs,
        checkDuplicateActionId,
      };
      checkActionList(block.events[key].try, actionContext);
      checkActionList(block.events[key].catch, actionContext);

      // Validate shortcut strings and collect refs for duplicate detection
      if (type.isObject(block.events[key]) && !type.isNone(block.events[key].shortcut)) {
        const shortcuts = type.isArray(block.events[key].shortcut)
          ? block.events[key].shortcut
          : [block.events[key].shortcut];
        shortcuts.forEach((shortcut) => {
          if (!type.isString(shortcut) || shortcut === '') {
            throw new ConfigError(
              `Event shortcut is not a valid string on event "${key}" on block "${block.blockId}" on page "${pageContext.pageId}".`,
              { received: shortcut, configKey: eventConfigKey }
            );
          }
          // The client's shortcut manager keys a plain object by the normalized
          // shortcut. Normalization neither creates nor removes a reserved name:
          // multi-character key names pass through unchanged, and no reserved
          // name is a single character. So checking the raw string is enough, and
          // a modified form like "Ctrl+__proto__" stays valid.
          if (isReserved(shortcut)) {
            throw new ConfigError(
              `Event shortcut "${shortcut}" on event "${key}" on block "${block.blockId}" on page "${pageContext.pageId}" is a reserved name and cannot be used as a shortcut.`,
              { configKey: eventConfigKey }
            );
          }
          if (BROWSER_DEFAULT_SHORTCUTS.has(shortcut.toLowerCase())) {
            pageContext.context.handleWarning(
              new ConfigWarning(
                `Shortcut "${shortcut}" on event "${key}" on block "${block.blockId}" on page "${pageContext.pageId}" conflicts with a browser default.`,
                { configKey: eventConfigKey }
              )
            );
          }
          pageContext.shortcutRefs.push({
            shortcut,
            blockId: block.blockId,
            eventId: key,
            configKey: eventConfigKey,
          });
        });
      }
    });
  }
}

export default buildEvents;
