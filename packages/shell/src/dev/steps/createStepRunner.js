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

import { get, type } from '@lowdefy/helpers';

import findBlock from './findBlock.js';
import findPageContext from '../tab/findPageContext.js';
import getShownPage from '../tab/getShownPage.js';
import waitForSettle from './waitForSettle.js';
import waitUntil, { sleep } from './waitUntil.js';

const STEPS = ['click', 'fill', 'select', 'press', 'wait', 'screenshot'];
const SETTLE_MS = 5000;

function readOptionLabel(option) {
  if (type.isObject(option)) {
    return String(option.label ?? option.value);
  }
  return String(option);
}

function readOptionValue(option) {
  return type.isObject(option) ? option.value : option;
}

/**
 * Runs the browser's journey steps on the shell, by block id: the dev-tab client's answer to a
 * step-request. A step acts through the engine, as the block's own view does when it is pressed
 * or typed in, and waits for the action chain it started to finish:
 * - `{ click: target }`: the block's onClick.
 * - `{ fill: { blockId, value } }`: sets the input's value, then its onChange.
 * - `{ select: { blockId, value } }`: the option whose label (or value) is `value`.
 * - `{ press: 'Enter' }`: the onPressEnter of the input filled last.
 * - `{ wait: { ms } | { request } | { state } }`.
 * - `{ screenshot: name? }`: the root view as a base64 PNG.
 * Resolves `{ ok: true, settled }` (and `image` for a screenshot); throws when the step cannot run.
 *
 * @param {Object} params
 * @param {() => Promise<string>} params.capture Captures the root view as a base64 PNG.
 * @param {() => Object} params.getLowdefy The open app's lowdefy object.
 * @param {number} [params.timeout] How long a step waits for its block or condition, in ms.
 */
function createStepRunner({ capture, getLowdefy, timeout = 5000 }) {
  let lastInputBlockId = null;

  async function settle(lowdefy) {
    const settled = await waitForSettle({ lowdefy, timeout: SETTLE_MS });
    return { ok: true, settled };
  }

  async function click({ lowdefy, target }) {
    const { block } = await findBlock({ lowdefy, target, timeout });
    if (block.eval.properties?.disabled === true) {
      throw new Error(`Block "${block.blockId}" is disabled.`);
    }
    await block.triggerEvent({ name: 'onClick' });
    return settle(lowdefy);
  }

  async function findInput({ lowdefy, target }) {
    const found = await findBlock({ lowdefy, target, timeout });
    if (!type.isFunction(found.block.setValue)) {
      throw new Error(`Block "${found.block.blockId}" is not an input.`);
    }
    return found.block;
  }

  async function setInputValue({ block, lowdefy, value }) {
    block.setValue(value);
    lastInputBlockId = block.blockId;
    await block.triggerEvent({ name: 'onChange' });
    return settle(lowdefy);
  }

  async function fill({ lowdefy, target }) {
    if (!type.isObject(target) || !Object.hasOwn(target, 'value')) {
      throw new Error(`A fill step needs { blockId, value }. Received ${JSON.stringify(target)}.`);
    }
    const block = await findInput({ lowdefy, target });
    return setInputValue({ block, lowdefy, value: target.value });
  }

  async function select({ lowdefy, target }) {
    if (!type.isObject(target) || !Object.hasOwn(target, 'value')) {
      throw new Error(
        `A select step needs { blockId, value }. Received ${JSON.stringify(target)}.`
      );
    }
    const block = await findInput({ lowdefy, target });
    const options = block.eval.properties?.options ?? [];
    const option = options.find((item) => readOptionLabel(item) === String(target.value));
    if (option === undefined) {
      throw new Error(
        `Block "${block.blockId}" has no option "${target.value}". Its options are ${JSON.stringify(
          options.map(readOptionLabel)
        )}.`
      );
    }
    return setInputValue({ block, lowdefy, value: readOptionValue(option) });
  }

  async function press({ key, lowdefy }) {
    if (key !== 'Enter') {
      throw new Error(`A phone presses only "Enter". Received ${JSON.stringify(key)}.`);
    }
    if (lastInputBlockId === null) {
      throw new Error('Press "Enter" needs an input filled before it.');
    }
    const { block } = await findBlock({ lowdefy, target: lastInputBlockId, timeout });
    await block.triggerEvent({ name: 'onPressEnter' });
    return settle(lowdefy);
  }

  async function waitFor({ lowdefy, until }) {
    if (type.isObject(until) && type.isNumber(until.ms)) {
      await sleep(until.ms);
      return { ok: true };
    }
    if (!type.isObject(until) || !(type.isString(until.request) || type.isString(until.state))) {
      throw new Error(
        `A wait step needs { ms }, { request } or { state }. Received ${JSON.stringify(until)}.`
      );
    }
    const done = await waitUntil({
      timeout,
      check: () => {
        const { context } = findPageContext({ lowdefy, page: getShownPage(lowdefy) });
        if (context === undefined) return undefined;
        if (type.isString(until.request)) {
          const call = context.requests?.[until.request]?.[0];
          return call !== undefined && call.loading !== true ? true : undefined;
        }
        return get(context.state, until.state) !== undefined ? true : undefined;
      },
    });
    if (done === undefined) {
      throw new Error(`Waited ${timeout} ms for ${JSON.stringify(until)}.`);
    }
    return { ok: true };
  }

  async function run({ step }) {
    if (!type.isObject(step) || Object.keys(step).length !== 1) {
      throw new Error(`A step is an object with one key. Received ${JSON.stringify(step)}.`);
    }
    const [name] = Object.keys(step);
    const lowdefy = getLowdefy();
    switch (name) {
      case 'click':
        return click({ lowdefy, target: step.click });
      case 'fill':
        return fill({ lowdefy, target: step.fill });
      case 'select':
        return select({ lowdefy, target: step.select });
      case 'press':
        return press({ key: step.press, lowdefy });
      case 'wait':
        return waitFor({ lowdefy, until: step.wait });
      case 'screenshot':
        return { ok: true, name: step.screenshot ?? null, image: await capture() };
      default:
        throw new Error(
          `A phone runs the steps ${STEPS.join(', ')}. Received ${JSON.stringify(name)}.`
        );
    }
  }

  return { run };
}

export default createStepRunner;
