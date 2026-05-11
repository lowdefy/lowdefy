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

import React, { useMemo, useCallback } from 'react';
import { type } from '@lowdefy/helpers';

// Lightweight dot-path accessor for resolving _get operators against a context object.
// Supports paths like "output.items.0.name" where numeric segments index into arrays.
function resolveGet(path, context) {
  if (!type.isString(path)) return undefined;
  const parts = path.split('.');
  let current = context;
  for (const part of parts) {
    if (type.isNone(current)) return undefined;
    current = current[part];
  }
  return current;
}

// Lightweight {{ path }} template resolver. Replaces {{ output.field }} with the
// resolved value from context. Only handles simple dot-path interpolation — not
// the full Nunjucks template language.
function resolveTemplate(template, context) {
  if (!type.isString(template)) return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const value = resolveGet(path, context);
    return type.isNone(value) ? '' : String(value);
  });
}

// Recursively walks a value tree and resolves operator objects ({ _get: "path" },
// { _nunjucks: "template" }) against the provided context. Non-operator objects
// and arrays are traversed; primitives are returned as-is.
function resolveOperators(value, context) {
  if (type.isNone(value)) return value;
  if (type.isArray(value)) {
    return value.map((item) => resolveOperators(item, context));
  }
  if (type.isObject(value)) {
    if (!type.isNone(value._get)) {
      return resolveGet(value._get, context);
    }
    if (!type.isNone(value._nunjucks)) {
      return resolveTemplate(value._nunjucks, context);
    }
    const resolved = {};
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = resolveOperators(val, context);
    }
    return resolved;
  }
  return value;
}

// Build event handlers for a display block. For each event name configured in
// agentEvents or events, creates a handler that:
// - agentEvents: resolves a message template and calls sendMessage
// - events: triggers a Lowdefy event via methods.triggerEvent
// Both can fire on the same event name.
function buildEventHandlers({ agentEvents, events, output, input, sendMessage, methods }) {
  const handlers = {};
  const eventNames = new Set([
    ...Object.keys(agentEvents ?? {}),
    ...Object.keys(events ?? {}),
  ]);

  for (const eventName of eventNames) {
    handlers[eventName] = (eventData) => {
      const context = { event: eventData, output, input };

      // agentEvents: resolve message template, send as new user message to agent
      const agentEventConfig = agentEvents?.[eventName];
      if (agentEventConfig?.message) {
        const message = resolveOperators(agentEventConfig.message, context);
        if (type.isString(message) && message.length > 0) {
          sendMessage({ text: message });
        }
      }

      // events: fire Lowdefy actions via triggerEvent
      if (events?.[eventName]) {
        methods.triggerEvent({
          name: eventName,
          event: eventData,
        });
      }
    };
  }

  return handlers;
}

function DynamicBlock({
  config,
  output,
  input,
  toolCallId,
  blockComponents,
  sendMessage,
  methods,
}) {
  const BlockComponent = blockComponents?.[config.type];

  const resolvedProperties = useMemo(() => {
    const context = { output, input };
    return resolveOperators(config.properties ?? {}, context);
  }, [config.properties, output, input]);

  const hasInteraction = config.agentEvents || config.events;

  const eventHandlers = useMemo(
    () =>
      hasInteraction
        ? buildEventHandlers({
            agentEvents: config.agentEvents,
            events: config.events,
            output,
            input,
            sendMessage,
            methods,
          })
        : {},
    [config.agentEvents, config.events, output, input, sendMessage, methods, hasInteraction]
  );

  // Build the methods object for the rendered block.
  // For interactive blocks, triggerEvent dispatches to our built handlers.
  // For read-only blocks, all methods are stubs.
  const blockMethods = useMemo(() => {
    const triggerEvent = hasInteraction
      ? ({ name, event }) => {
          const handler = eventHandlers[name];
          if (handler) {
            handler(event);
          }
        }
      : () => {};

    return {
      makeCssClass: () => '',
      triggerEvent,
      registerMethod: () => {},
      registerEvent: () => {},
    };
  }, [eventHandlers, hasInteraction]);

  if (!BlockComponent) {
    return (
      <div style={{ color: '#8c8c8c', fontSize: '0.85em', padding: '4px 0' }}>
        Display block type &quot;{config.type}&quot; not available.
      </div>
    );
  }

  // For interactive blocks, build an events object so the block knows which
  // events are registered (blocks check events[name] to decide if handlers fire).
  const blockEvents = useMemo(() => {
    if (!hasInteraction) return {};
    const evts = {};
    for (const name of Object.keys(eventHandlers)) {
      evts[name] = { actions: [] };
    }
    return evts;
  }, [eventHandlers, hasInteraction]);

  return (
    <div style={{ padding: '8px 0' }}>
      <BlockComponent
        blockId={`display-${toolCallId}`}
        events={blockEvents}
        methods={blockMethods}
        properties={resolvedProperties}
      />
    </div>
  );
}

export default DynamicBlock;
