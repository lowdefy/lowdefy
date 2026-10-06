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

import { filterElementsChain, type } from '@lowdefy/helpers';

// Chain keys that only describe structure and stay as they are. Any other attribute goes, so an
// attribute posthog-js or a block adds later cannot carry data out.
const CHAIN_STRUCTURAL_KEYS = new Set([
  'attr__class',
  'attr__col-id',
  'attr__id',
  'attr__role',
  'attr__row-index',
  'attr__type',
  'attr_id',
  'nth-child',
  'nth-of-type',
]);
const CHAIN_TEXT_KEYS = new Set(['text']);
const CHAIN_HREF_KEYS = new Set(['href', 'attr__href']);

// The same keys in an `$elements` entry, as posthog-js builds them before writing the chain.
const ELEMENT_STRUCTURAL_KEYS = new Set([
  'attr__class',
  'attr__col-id',
  'attr__id',
  'attr__role',
  'attr__row-index',
  'attr__type',
  'classes',
  'nth_child',
  'nth_of_type',
  'tag_name',
]);
const ELEMENT_TEXT_KEYS = new Set(['$el_text']);
const ELEMENT_HREF_KEYS = new Set(['attr__href']);

// Top-level properties that carry text, removed unless the text is config text. A text property
// the plugin adds to events goes in this list, so it is masked like the rest.
const TEXT_PROPERTIES = ['$el_text', '$selected_content', '$external_click_url'];

// How one attribute is masked: structural keys stay, a text stays only when keepText passes it,
// an href that fails is emptied so the link still reads as a link, and everything else goes.
function createMaskValue({ structuralKeys, textKeys, hrefKeys, keepText }) {
  return function maskValue({ key, value }) {
    if (structuralKeys.has(key)) {
      return value;
    }
    if (textKeys.has(key)) {
      return keepText(value) ? value : null;
    }
    if (hrefKeys.has(key)) {
      return keepText(value) ? value : '';
    }
    return null;
  };
}

function maskElement({ element, maskValue }) {
  if (!type.isObject(element)) {
    return element;
  }
  const masked = {};
  Object.entries(element).forEach(([key, value]) => {
    const kept = maskValue({ key, value });
    if (!type.isNull(kept)) {
      masked[key] = kept;
    }
  });
  return masked;
}

function maskProperties({ properties, keepText }) {
  if (type.isString(properties.$elements_chain)) {
    properties.$elements_chain = filterElementsChain({
      chain: properties.$elements_chain,
      filterAttribute: createMaskValue({
        structuralKeys: CHAIN_STRUCTURAL_KEYS,
        textKeys: CHAIN_TEXT_KEYS,
        hrefKeys: CHAIN_HREF_KEYS,
        keepText,
      }),
    });
  }
  if (type.isArray(properties.$elements)) {
    const maskValue = createMaskValue({
      structuralKeys: ELEMENT_STRUCTURAL_KEYS,
      textKeys: ELEMENT_TEXT_KEYS,
      hrefKeys: ELEMENT_HREF_KEYS,
      keepText,
    });
    properties.$elements = properties.$elements.map((element) =>
      maskElement({ element, maskValue })
    );
  }
  TEXT_PROPERTIES.forEach((name) => {
    if (name in properties && !keepText(properties[name])) {
      delete properties[name];
    }
  });
}

// Removes the text of the app's data from an event before posthog-js sends it: every text-bearing
// value stays only when the config of the page it was captured on (or the menus, messages or
// antd locale) spells it out, and element attributes go by an allow-list. It acts on the fields
// an event carries, never on its name, so every click event posthog-js has or adds is covered.
// posthog-js drops an event whose before_send throws, so a failing check strips all text instead.
function maskEventText({ event, trace, pageId }) {
  if (!type.isObject(event.properties)) {
    return event;
  }
  try {
    maskProperties({
      properties: event.properties,
      keepText: (text) => type.isString(text) && trace.isConfigText({ text, pageId }) === true,
    });
  } catch (error) {
    maskProperties({ properties: event.properties, keepText: () => false });
  }
  return event;
}

export default maskEventText;
