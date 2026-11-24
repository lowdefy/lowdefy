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

import { type } from '@lowdefy/helpers';

import readStandInState from './readStandInState.js';

const BROWSER = 'the step runs in a browser';

// The number text @rc-component/mini-decimal reads (validateNumber): 11.28, 1. or .1, with a sign.
const NUMBER_TEXTS = [/^\s*-?\d+(\.\d+)?\s*$/, /^\s*-?\d+\.\s*$/, /^\s*-?\.\d+\s*$/];

// Text that holds only digits, white space and signs reads the same with any decimal separator.
const SEPARATOR_FREE = /^[\d\s+-]*$/;

// The decimal separator NumberInput hands antd's InputNumber: its own property, else the active
// locale's (lowdefy.i18n's active, else its defaultLocale), else '.'. An app with no i18n (the
// build writes it as {}) has no locale, so '.'; with i18n the active locale is the person's pick
// or the browser's language, which a headless run does not know: null.
function readDecimalSeparator({ actor, block }) {
  const property = block.eval.properties?.decimalSeparator;
  if (!type.isNone(property)) {
    return property;
  }
  return type.isNone(actor.i18n?.defaultLocale) ? '.' : null;
}

// The number a parsed text holds, as getMiniDecimal reads it: null for empty text, NaN for text
// that is no number (a lone sign, letters). A number in e notation reads as Number does.
function readNumber(parsed) {
  if (parsed.trim() === '') {
    return null;
  }
  if (parsed.includes('e') && !Number.isNaN(Number(parsed))) {
    return Number(parsed);
  }
  return NUMBER_TEXTS.some((pattern) => pattern.test(parsed)) ? Number(parsed) : NaN;
}

function readBound(bound) {
  if (type.isNumber(bound)) {
    return bound;
  }
  const number = type.isString(bound) ? readNumber(bound) : NaN;
  return type.isNumber(number) && !Number.isNaN(number) ? number : null;
}

// While a person types, InputNumber leaves a number outside min and max alone: it sets the value
// only once the input blurs, clamped then.
function isInRange({ block, number }) {
  const min = readBound(block.eval.properties?.min);
  const max = readBound(block.eval.properties?.max);
  return (max === null || number <= max) && (min === null || number >= min);
}

// The digits after the point of a number text, trailing zeros aside, as mini-decimal counts a
// precision; e notation counts as more than any precision.
function countDecimals(text) {
  if (text.toLowerCase().includes('e')) {
    return Infinity;
  }
  const [, decimals = ''] = text.trim().split('.');
  return decimals.replace(/0+$/, '').length;
}

// The text the block shows: the one typed last, while the value is the one that fill left, else
// the value's own.
function readShownText({ actor, block }) {
  const { typed } = readStandInState({ actor, block });
  if (!type.isUndefined(typed) && typed.value === block.value) {
    return typed.parsed;
  }
  return type.isNone(block.value) ? '' : String(block.value);
}

// Why Enter in a NumberInput needs a browser, or undefined. Before onPressEnter, InputNumber reads
// its text again as a finished number (flushInputValue): text that is no number falls back to the
// value, a number outside min and max is clamped into it, and a `precision` rounds it. Only when
// that changes the number does onChange fire, which a headless run does not model; otherwise Enter
// fires onPressEnter alone, as the step runner's press does.
function checkNumberInputEnter({ actor, block }) {
  if (!type.isNone(block.eval.properties?.parser)) {
    return `Block "${block.blockId}" (NumberInput) reads its text with its own parser as Enter is pressed, which a headless run does not model: the step runs in a browser.`;
  }
  let text = readShownText({ actor, block });
  let number = readNumber(text);
  if (Number.isNaN(number)) {
    text = type.isNone(block.value) ? '' : String(block.value);
    number = readNumber(text);
  }
  if (number === null || Number.isNaN(number)) {
    return undefined;
  }
  const precision = block.eval.properties?.precision;
  const rounds = type.isNumber(precision) && precision >= 0 && countDecimals(text) > precision;
  if (!isInRange({ block, number }) || rounds) {
    return `Enter in block "${block.blockId}" (NumberInput) ${
      rounds ? 'rounds' : 'clamps'
    } ${number} to its ${
      rounds ? 'precision' : 'min and max'
    } and fires onChange, which a headless run does not model: the step runs in a browser.`;
  }
  return undefined;
}

// A fill of a NumberInput, as antd's InputNumber (@rc-component/input-number) takes the text
// Playwright types in one input event: it swaps the first decimal separator for '.', drops every
// character but letters, digits, '_', '.' and '-' (its default parser), and reads the number. The
// value changes, and onChange fires with { value }, only for a number in min and max (or empty
// text, which is null) that differs from the value now. Text that is no number, or a number out
// of range, changes nothing, as in a browser. The value is a number, as InputNumber's onChange
// gives it, never the text. The press that follows acts on this input either way, and Enter reads
// the text kept here (state.typed, checkNumberInputEnter). A block with its
// own `parser`, or text whose meaning hangs on a locale the run does not know, needs a browser.
// The fill's own checks have passed (checkFillTarget).
async function fillNumberInput({ actor, block, step }) {
  const text = String(step.fill.value);
  if (!type.isNone(block.eval.properties?.parser)) {
    actor.browserOnly.push(
      `Block "${block.blockId}" (NumberInput) reads typed text with its own parser, which a headless run does not model: ${BROWSER}.`
    );
    return;
  }
  const separator = readDecimalSeparator({ actor, block });
  if (separator === null && !SEPARATOR_FREE.test(text)) {
    actor.browserOnly.push(
      `Block "${block.blockId}" (NumberInput) reads "${text}" with the decimal separator of the browser's locale, which a headless run does not know: ${BROWSER}.`
    );
    return;
  }
  const parsed = (separator === null ? text : text.replace(separator, '.')).replace(
    /[^\w.-]+/g,
    ''
  );
  const number = readNumber(parsed);
  const state = readStandInState({ actor, block });
  const current = type.isString(block.value) ? readNumber(block.value) : (block.value ?? null);
  if (
    Number.isNaN(number) ||
    (number !== null && !isInRange({ block, number })) ||
    number === current
  ) {
    actor.stepRunner.setLastInputBlockId(block.blockId);
    state.typed = { parsed, value: block.value };
    return;
  }
  await actor.stepRunner.run({ step: { fill: { ...step.fill, value: number } } });
  state.typed = { parsed, value: block.value };
  await actor.settle();
}

export { checkNumberInputEnter };

export default fillNumberInput;
