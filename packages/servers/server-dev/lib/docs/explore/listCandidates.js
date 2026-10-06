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

// Serialized into the walk's page by page.evaluate, so this function must be
// pure: it may reference nothing but `window`, `document` and its argument.
//
// Lists the controls a walk could act on, raw: each visible, enabled element
// matching the interactive-control selector inside the front-most open layer
// (a menu, else a dialog, else the page), described by the engine's own
// describeElement so a target reads back exactly as the journey runner
// resolves it, with what observeWalk needs to classify it: the control's
// element facts, the block's evaluated input properties and options, and a
// grid row's text. Also the page's open layers and its top-level state keys
// with value types, for the state shape. Throws when the page has no trace
// registry: a walk never guesses targets without it.
function listCandidates({ interactiveControl, layers, popupTrigger, popupContainer, maxOptions }) {
  const lowdefy = window.lowdefy;
  if (!lowdefy || !lowdefy._trace || typeof lowdefy._trace.describeElement !== 'function') {
    throw new Error(
      'The walk page has no Lowdefy trace registry (window.lowdefy._trace), so its controls cannot be described. Restart the dev server so pages load the current client.'
    );
  }
  const TEXT_INPUT_TYPES = ['', 'text', 'email', 'number', 'password', 'search', 'tel', 'url'];

  function isVisible(element) {
    if (typeof element.checkVisibility === 'function') {
      if (!element.checkVisibility({ visibilityProperty: true })) return false;
    }
    const { width, height } = element.getBoundingClientRect();
    return width > 0 && height > 0;
  }

  function isEnabled(element) {
    return element.disabled !== true && element.getAttribute('aria-disabled') !== 'true';
  }

  function textOf(element) {
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    return text === '' ? null : text;
  }

  function layerName(element) {
    const labelledBy = element.getAttribute('aria-labelledby');
    const labelElement = labelledBy ? document.getElementById(labelledBy) : null;
    return (
      element.id ||
      element.getAttribute('aria-label') ||
      (labelElement ? textOf(labelElement) : null) ||
      element.getAttribute('role')
    );
  }

  let root = document;
  for (const selector of layers) {
    const open = [...document.querySelectorAll(selector)].filter(isVisible);
    if (open.length > 0) {
      root = open[open.length - 1];
      break;
    }
  }
  const openLayers = [...document.querySelectorAll(layers.join(', '))]
    .filter(isVisible)
    .map(layerName);

  const pageId = lowdefy.pageId ?? null;
  // The instance on screen is the shown page's most recently rendered one.
  const instanceKey = lowdefy.pageInstances?.[pageId]?.at(-1);
  const context = lowdefy.contexts?.[instanceKey];
  const blockMap = context?._internal?.RootSlots?.map ?? {};
  const state = context?.state ?? {};
  const stateShape = Object.keys(state)
    .sort()
    .map((key) => {
      const value = state[key];
      if (Array.isArray(value)) return [key, 'array'];
      if (value === null) return [key, 'null'];
      return [key, typeof value];
    });

  function optionLabels(block, control) {
    const options = block?.eval?.properties?.options;
    let labels = [];
    if (Array.isArray(options)) {
      labels = options.map((option) => {
        if (option !== null && typeof option === 'object') {
          return typeof option.label === 'string' ? option.label : String(option.value);
        }
        return String(option);
      });
    } else if (control.tagName === 'SELECT') {
      labels = [...control.options].map((option) => textOf(option) ?? option.value);
    }
    return labels.slice(0, maxOptions);
  }

  function blockFacts(blockId, control) {
    const block = blockId === null ? undefined : blockMap[blockId];
    if (block === undefined) return null;
    const properties = block.eval?.properties ?? {};
    const label = [properties.label?.title, properties.title, properties.label].find(
      (candidate) => typeof candidate === 'string'
    );
    return {
      type: block.type ?? null,
      valueType: block.meta?.valueType ?? null,
      required: block.eval?.required === true,
      maxLength: typeof properties.maxLength === 'number' ? properties.maxLength : null,
      min: typeof properties.min === 'number' ? properties.min : null,
      max: typeof properties.max === 'number' ? properties.max : null,
      hasValidate: Array.isArray(block.validate) && block.validate.length > 0,
      label: label ?? null,
      options: optionLabels(block, control),
    };
  }

  const seen = new Set();
  const controls = [];
  [...root.querySelectorAll(interactiveControl)].forEach((control) => {
    if (!isVisible(control) || !isEnabled(control)) return;
    const description = lowdefy._trace.describeElement(control);
    // The runner finds a control through its block or its text, so one with
    // neither (an icon button outside every block) is no target a step can
    // name.
    if (description.block_id === null && description.text === null) return;
    const key = JSON.stringify([
      description.block_id,
      description.row,
      description.column,
      description.text,
      description.nth,
    ]);
    if (seen.has(key)) return;
    seen.add(key);
    const tag = control.tagName.toLowerCase();
    const inputType = tag === 'input' ? (control.getAttribute('type') ?? '').toLowerCase() : null;
    const href = tag === 'a' ? control.getAttribute('href') : null;
    const row = control.closest('.ag-row');
    controls.push({
      description,
      textInput:
        control.getAttribute('role') !== 'combobox' &&
        (tag === 'textarea' || (tag === 'input' && TEXT_INPUT_TYPES.includes(inputType))),
      popup: control.matches(popupTrigger) || control.closest(popupContainer) !== null,
      link:
        href === null
          ? null
          : {
              offOrigin: new URL(href, window.location.href).origin !== window.location.origin,
              newTab: control.getAttribute('target') === '_blank',
            },
      text: textOf(control),
      rowText: description.row === null || row === null ? null : textOf(row),
      block: blockFacts(description.block_id, control),
    });
  });

  return {
    pageId,
    pathParams: context?.pathParams ?? {},
    url: `${window.location.pathname}${window.location.search}`,
    layers: openLayers,
    stateShape,
    controls,
  };
}

export default listCandidates;
