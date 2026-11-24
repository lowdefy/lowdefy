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

import markdownToHtml from './blockText/markdownToHtml.js';
import mayShowText from './blockText/mayShowText.js';
import normalizeShownText from './blockText/normalizeShownText.js';
import readHtmlPieces from './blockText/readHtmlPieces.js';
import readTextModel from './blockText/readTextModel.js';
import readNodeText from './readNodeText.js';

// The units an html string shows (readHtmlPieces'), cached by string, since a check reads the
// page every 50 ms.
function readHtmlUnits({ cache, html, parse, pre }) {
  const key = `${pre}:${html}`;
  if (!cache.has(key)) {
    const { units, open } = readHtmlPieces({ root: parse(html), pre });
    cache.set(key, { units, open });
  }
  return cache.get(key);
}

// The units one piece of a block's text model shows, and why some of it is not known (or null),
// as LDF-1147's readBlockText reads them.
function readPieceUnits({ cache, parse, piece }) {
  if (!type.isUndefined(piece.text)) {
    return { units: [normalizeShownText(piece.text)], open: null };
  }
  if (!type.isUndefined(piece.either)) {
    const asHtml = readHtmlUnits({ cache, html: piece.either, parse, pre: false });
    return { units: [...asHtml.units, normalizeShownText(piece.either)], open: asHtml.open };
  }
  if (type.isUndefined(piece.markdown)) {
    return readHtmlUnits({ cache, html: piece.html, parse, pre: piece.pre === true });
  }
  const { html, open } = markdownToHtml({
    markdown: piece.sanitize === true ? parse.sanitize(piece.markdown) : piece.markdown,
    raw: piece.raw === true,
    skipHtml: piece.skipHtml === true,
  });
  const read = readHtmlUnits({ cache, html, parse, pre: false });
  return { units: read.units, open: read.open ?? open };
}

// Every string and number in a block's evaluated properties: text it may show on hover or focus
// (a tooltip), which its text model leaves out.
function collectValues(value, values = []) {
  if (type.isString(value)) {
    values.push(value);
  } else if (type.isNumber(value)) {
    values.push(String(value));
  } else if (type.isArray(value)) {
    value.forEach((item) => collectValues(item, values));
  } else if (type.isObject(value)) {
    Object.values(value).forEach((item) => collectValues(item, values));
  }
  return values;
}

// Whether a block other than a ClickableHtml may show `text` in a browser, on the safe side: a
// block with no text model (LDF-1147's readTextModel), or one whose model leaves some of its text
// open, may show anything; otherwise it may when its model's text or any string or number in its
// properties could read as the text (mayShowText). Its areas count as drawn and the blocks in them
// are read on their own, so an area the model leaves out cannot hide text it draws.
// ancestors are the blocks holding it (listBlockAncestors); parse is loadHtmlDom's; cache holds
// the html read so far, by string.
function mayBlockShowText({ ancestors, block, blockMetas, cache, i18n, parse, text }) {
  const model = readTextModel({ block, blockMetas });
  if (model === null) {
    return true;
  }
  const properties = block.eval?.properties ?? {};
  const { pieces, open } = model({ ancestors, areaNames: new Set(), block, i18n, properties });
  if (open !== null) {
    return true;
  }
  const read = pieces.map((piece) => readPieceUnits({ cache, parse, piece }));
  if (read.some((piece) => piece.open !== null)) {
    return true;
  }
  const values = collectValues(properties).map((value) =>
    normalizeShownText(/[<&]/.test(value) ? readNodeText(parse(value)) : value)
  );
  return mayShowText({ contains: text, units: [...read.flatMap(({ units }) => units), ...values] });
}

export default mayBlockShowText;
