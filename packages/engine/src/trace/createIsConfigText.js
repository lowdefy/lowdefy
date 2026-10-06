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

import { builtinMessages, type } from '@lowdefy/helpers';

// Build markers: their values are key and reference ids, not text the app shows.
const MARKER_KEYS = new Set(['~k', '~r', '~l', '~ignoreBuildChecks']);

// Clicked text as targetFromElementsChain and the reader-side config text set normalise it.
function normaliseText(value) {
  if (!type.isString(value)) {
    return null;
  }
  const text = value.replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
}

// Strings only: a number leaf is not config text, so a page size of 42 never keeps a grid cell
// showing "42". A Dynamic block's content is endpoint output, not config, so its subtree is skipped.
function addStringLeaves({ value, texts }) {
  if (type.isString(value)) {
    const text = normaliseText(value);
    if (!type.isNull(text)) {
      texts.add(text);
    }
    return;
  }
  if (type.isArray(value)) {
    value.forEach((item) => addStringLeaves({ value: item, texts }));
    return;
  }
  if (type.isObject(value)) {
    if (value.type === 'Dynamic') {
      return;
    }
    Object.entries(value).forEach(([key, item]) => {
      if (MARKER_KEYS.has(key)) {
        return;
      }
      addStringLeaves({ value: item, texts });
    });
  }
}

// Whether a clicked text is spelled out by the config of the page it was clicked on, the menus,
// the i18n and built-in messages, or the antd locale. The PostHog plugin keeps only such text, so
// data text never leaves the browser. Each source's set is built once per source object: a locale
// switch, a late antd locale load, a dev reload or a re-resolved dynamic page hands over a new
// object, so a fresh set is built on the next call and nothing is invalidated by hand.
function createIsConfigText({ lowdefy, pathEntryOf }) {
  const textSets = new WeakMap();

  function textSetOf(source) {
    if (!type.isObject(source) && !type.isArray(source)) {
      return null;
    }
    if (!textSets.has(source)) {
      const texts = new Set();
      addStringLeaves({ value: source, texts });
      textSets.set(source, texts);
    }
    return textSets.get(source);
  }

  // The raw config of the page instance the URL shows, when that instance is pageId's.
  function pageConfigOf(pageId) {
    if (!type.isString(pageId)) {
      return null;
    }
    const entry = pathEntryOf(window.location.href);
    const context = lowdefy.contexts?.[entry?.instanceKey];
    if (context?.pageId !== pageId) {
      return null;
    }
    return context._internal.pageConfig;
  }

  return function isConfigText({ text, pageId }) {
    const normalised = normaliseText(text);
    if (type.isNull(normalised)) {
      return false;
    }
    const sources = [
      pageConfigOf(pageId),
      lowdefy.menus,
      lowdefy.i18n?.messages,
      lowdefy.i18n?.locales,
      builtinMessages,
      window.__lowdefy_antd_locale,
    ];
    return sources.some((source) => textSetOf(source)?.has(normalised) === true);
  };
}

export default createIsConfigText;
