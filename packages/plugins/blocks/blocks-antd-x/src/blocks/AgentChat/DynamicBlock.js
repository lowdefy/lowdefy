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

import React, { useMemo } from 'react';
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

function DynamicBlock({ config, output, input, toolCallId, blockComponents }) {
  const BlockComponent = blockComponents?.[config.type];

  const resolvedProperties = useMemo(() => {
    const context = { output, input };
    return resolveOperators(config.properties ?? {}, context);
  }, [config.properties, output, input]);

  if (!BlockComponent) {
    return (
      <div style={{ color: '#8c8c8c', fontSize: '0.85em', padding: '4px 0' }}>
        Display block type &quot;{config.type}&quot; not available.
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <BlockComponent
        blockId={`display-${toolCallId}`}
        events={{}}
        methods={{
          makeCssClass: () => '',
          triggerEvent: () => {},
          registerMethod: () => {},
          registerEvent: () => {},
        }}
        properties={resolvedProperties}
      />
    </div>
  );
}

export default DynamicBlock;
