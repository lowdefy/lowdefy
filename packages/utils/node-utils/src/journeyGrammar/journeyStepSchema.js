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

import JOURNEY_STEP_EXAMPLES from './journeyStepExamples.js';

// The journey step grammar as a JSON schema, for agents to read. The grammar
// itself is validateJourneySteps; its tests check this schema accepts and
// refuses the same steps. Rules across steps (expect.error and expect.effect
// directly follow an interaction, expect.status follows a call or request) and
// a fromEmail match being a valid regular expression are checked by the
// validator only.

const nonEmptyString = { type: 'string', minLength: 1 };
const index = { type: 'integer', minimum: 0 };
const FROM = {
  enum: ['recorded', 'shape'],
  description:
    'Where the value came from: "recorded" (observed in a trace) or "shape" (value: null, a placeholder the runner refuses until it is filled in).',
};

const TARGET_PROPERTIES = {
  blockId: { type: 'string', description: "Scopes the target to the block's wrapper." },
  text: {
    type: 'string',
    description:
      'Exact text of the interactive control to use. Without blockId it searches the whole page, which reaches confirm dialog buttons, modal footers, dropdown menu items and email links.',
  },
  containing: {
    ...nonEmptyString,
    description: 'Text the element shows, e.g. the email address a list row shows.',
  },
  row: { ...index, description: 'Zero-based grid row, as displayed. Needs blockId.' },
  column: { type: 'string', description: 'Grid column id. Needs blockId.' },
  nth: { ...index, description: 'Zero-based pick among several matches.' },
};

function targetObject({ properties = {}, required = [], requireBlockId = false }) {
  const schema = {
    type: 'object',
    properties: { ...TARGET_PROPERTIES, ...properties },
    additionalProperties: false,
    required,
    not: { required: ['text', 'containing'] },
    dependencies: { row: ['blockId'], column: ['blockId'] },
  };
  if (requireBlockId) {
    schema.required = ['blockId', ...required];
  } else {
    schema.anyOf = [
      { required: ['blockId'] },
      { required: ['text'] },
      { required: ['containing'] },
    ];
  }
  return schema;
}

const TARGET = {
  description: 'A blockId string, or a target object.',
  oneOf: [{ type: 'string' }, targetObject({})],
};

// A null value is a placeholder, so it must be marked from: shape.
const VALUE_PLACEHOLDER_RULE = {
  if: { properties: { value: { type: 'null' } }, required: ['value'] },
  then: { properties: { from: { const: 'shape' } }, required: ['from'] },
};

const FROM_EMAIL = {
  type: 'object',
  description:
    'Type text read from the newest email to "to": the first match of the regular expression "match", or its first capture group.',
  properties: {
    to: nonEmptyString,
    subject: { type: 'string' },
    match: { ...nonEmptyString, description: 'A regular expression, e.g. "\\\\b\\\\d{6}\\\\b".' },
  },
  required: ['to', 'match'],
  additionalProperties: false,
};

function valueTarget() {
  return {
    ...targetObject({
      properties: { value: {}, from: FROM },
      required: ['value'],
      requireBlockId: true,
    }),
    ...VALUE_PLACEHOLDER_RULE,
  };
}

function singleKey(properties) {
  return Object.entries(properties).map(([key, value]) => ({
    type: 'object',
    properties: { [key]: value },
    required: [key],
    additionalProperties: false,
  }));
}

const CALL_MATCH_PROPERTIES = {
  count: index,
  payload: { description: 'Partial match on the payload the last call sent.' },
  response: { description: 'Partial match on the response the last call got.' },
};

const CALL_MATCH_REQUIRED = [
  { required: ['count'] },
  { required: ['payload'] },
  { required: ['response'] },
];

const EXPECT_KINDS = {
  state: {
    type: 'object',
    description: 'State at "path" deep-equals "equals".',
    properties: { path: { type: 'string' }, equals: {}, from: FROM },
    required: ['path', 'equals'],
    additionalProperties: false,
  },
  visible: TARGET,
  hidden: {
    ...TARGET,
    description:
      'Nothing the target names is visible. Passes at once when nothing matches yet, so pair it with something that must be present first.',
  },
  text: targetObject({
    properties: { contains: { type: 'string' } },
    required: ['contains'],
    requireBlockId: true,
  }),
  url: {
    type: 'object',
    properties: { contains: { type: 'string' } },
    required: ['contains'],
  },
  title: {
    description: 'The document title.',
    oneOf: singleKey({ equals: { type: 'string' }, contains: { type: 'string' } }),
  },
  calls: {
    description:
      'The calls this actor made to the request (on pageId, default the current page) or the endpoint since the journey started: how many ("count"), and what the last one sent ("payload") and got back ("response"). payload and response match partially: each key given must deep-equal the call\'s. Give at least one of count, payload and response.',
    oneOf: [
      {
        type: 'object',
        properties: {
          request: nonEmptyString,
          pageId: nonEmptyString,
          ...CALL_MATCH_PROPERTIES,
        },
        required: ['request'],
        anyOf: CALL_MATCH_REQUIRED,
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: { endpoint: nonEmptyString, ...CALL_MATCH_PROPERTIES },
        required: ['endpoint'],
        anyOf: CALL_MATCH_REQUIRED,
        additionalProperties: false,
      },
    ],
  },
  error: {
    ...nonEmptyString,
    description:
      'Text an app error contains: one raised by the interaction step directly before this one, or the error answer of the call or request before it (only expect steps between).',
  },
  status: {
    type: 'integer',
    minimum: 100,
    maximum: 599,
    description:
      'The HTTP status of the answer to the call or request before this step (only expect steps between), e.g. 401 or 403.',
  },
  db: {
    type: 'object',
    description:
      'The documents "match" finds in "collection" of the journey\'s data set database (on connection "connectionId", default the app\'s one database): "count" of them, or exactly the list "equals" in _id order, each document holding at least the keys given. Proves a write happened, or did not.',
    properties: {
      collection: nonEmptyString,
      connectionId: nonEmptyString,
      match: { type: 'object', description: 'A MongoDB query; {} matches every document.' },
      count: index,
      equals: { type: 'array', items: { type: 'object' } },
    },
    required: ['collection', 'match'],
    oneOf: [{ required: ['count'] }, { required: ['equals'] }],
    additionalProperties: false,
  },
  effect: {
    const: true,
    description:
      'Fails when the interaction step directly before this one did nothing: no event ran, the page did not change, no request or endpoint was called and the URL stayed the same.',
  },
};

const CALL_AS = {
  description:
    'Who calls: a data set user\'s name, "none" for signed out, or an inline user object. Defaults to the journey\'s user.',
  anyOf: [nonEmptyString, { type: 'object' }],
};

const CALL_PAYLOAD = {
  type: 'object',
  description:
    'The payload, sent as given: ids, operator objects or wrong types a page would never send.',
};

const STEPS = {
  click: {
    description: 'Click a target. "count": 2 or 3 clicks in quick succession, a double click.',
    oneOf: [
      { type: 'string' },
      targetObject({ properties: { count: { type: 'integer', minimum: 1, maximum: 3 } } }),
    ],
  },
  open: {
    ...TARGET,
    description:
      "Open an input's dropdown or picker popup and wait for it to show, so a following screenshot captures it.",
  },
  fill: {
    description: 'Type a value into a block, or text read from an email.',
    oneOf: [
      valueTarget(),
      targetObject({
        properties: { fromEmail: FROM_EMAIL },
        required: ['fromEmail'],
        requireBlockId: true,
      }),
    ],
  },
  select: {
    ...valueTarget(),
    description:
      'Pick an option by exact text: a dropdown option, a radio, button or segmented option in the block, or a checkbox option in the block, which it ticks and never unticks.',
  },
  press: {
    type: 'string',
    description: 'A key, e.g. "Enter" or "Mod+k" (Mod is Meta or Control per platform).',
  },
  back: { enum: [true, null], description: 'The browser Back button.' },
  goto: {
    description: 'Load an app page like a typed URL.',
    oneOf: [
      nonEmptyString,
      {
        type: 'object',
        properties: {
          pageId: nonEmptyString,
          pathParams: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: "One string per placeholder of the page's path.",
          },
          urlQuery: { type: 'object' },
        },
        required: ['pageId'],
        additionalProperties: false,
      },
    ],
  },
  email: {
    type: 'object',
    description:
      'Open the newest email to "to" that arrived during this journey, subject containing the text, waiting for it if needed.',
    properties: { to: nonEmptyString, subject: { type: 'string' } },
    required: ['to'],
    additionalProperties: false,
  },
  as: {
    ...nonEmptyString,
    description:
      'Switch to another person, with their own browser and cookies. The journey starts as "main".',
  },
  wait: {
    description:
      'Wait for a request started since the last interaction to finish, or for a state path to be defined. { ms } (or a bare number of ms) waits a fixed time, which the lowdefy test lint refuses (L3): prefer a request, a state or an expect.',
    oneOf: [
      { type: 'number' },
      ...singleKey({
        ms: { type: 'number' },
        request: { type: 'string' },
        state: { type: 'string' },
      }),
    ],
  },
  screenshot: {
    description: 'Capture the page, with an optional name.',
    anyOf: [{ type: 'string' }, { enum: [true, null] }],
  },
  expect: {
    description:
      'Assert one thing about the page, the answer of the call before it, or the database. Each waits until it holds or the step times out.',
    oneOf: singleKey(EXPECT_KINDS),
  },
  call: {
    type: 'object',
    description:
      'Call an endpoint directly, outside any page, as the journey\'s user or the user named in "as". For what a page would never send; reach a call the page sends through its own event instead. Read the answer with expect: { status } and expect: { error }.',
    properties: { endpoint: nonEmptyString, payload: CALL_PAYLOAD, as: CALL_AS },
    required: ['endpoint'],
    additionalProperties: false,
  },
  request: {
    type: 'object',
    description:
      'Call a page\'s request directly, as the journey\'s user or the user named in "as". For what the page would never send; reach a request the page sends through its own event instead. Read the answer with expect: { status } and expect: { error }.',
    properties: {
      pageId: nonEmptyString,
      requestId: nonEmptyString,
      payload: CALL_PAYLOAD,
      as: CALL_AS,
    },
    required: ['pageId', 'requestId'],
    additionalProperties: false,
  },
};

function stepSchema(key) {
  return {
    type: 'object',
    properties: { [key]: { ...STEPS[key], examples: JOURNEY_STEP_EXAMPLES[key] } },
    required: [key],
    additionalProperties: false,
  };
}

const JOURNEY_STEP_SCHEMAS = Object.fromEntries(
  Object.keys(STEPS).map((key) => [key, stepSchema(key)])
);

const journeyStepSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Journey step',
  description:
    'One step of a journey: an object with exactly one key, the step name. A target is a blockId string or an object of { blockId, text, containing, row, column, nth }; fill, select and expect.text need a blockId. expect.error and expect.effect must directly follow an interaction step (click, open, fill, select, press, back). expect.error may instead read the answer of a call or request step, and expect.status must; only expect steps may sit between the call and them. A journey with no pageId runs only call, request, as, wait: { ms } and expect on error, status, calls (with a pageId for a request) or db.',
  oneOf: Object.values(JOURNEY_STEP_SCHEMAS),
};

export { JOURNEY_STEP_SCHEMAS };
export default journeyStepSchema;
