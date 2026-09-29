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

function toPx(value) {
  return Number.parseFloat(value) || 0;
}

function toFont(style) {
  return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

// Reads the chip, count and cell styles once from a hidden copy of the markup, so the widths
// follow the theme's tokens (font, padding, border, gap) without measuring any rendered cell.
function readStyles() {
  const probe = document.createElement('div');
  probe.className = 'lf-table';
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;top:0;left:-10000px;visibility:hidden;contain:strict';
  probe.innerHTML =
    '<div class="lf-table-gridcell"><span class="lf-table-chips">' +
    '<span class="lf-table-tag">x</span><span class="lf-table-more">+1</span></span></div>';
  document.body.appendChild(probe);
  const cell = getComputedStyle(probe.firstChild);
  const chips = getComputedStyle(probe.querySelector('.lf-table-chips'));
  const tag = getComputedStyle(probe.querySelector('.lf-table-tag'));
  const more = getComputedStyle(probe.querySelector('.lf-table-more'));
  const styles = {
    cellInset: toPx(cell.paddingLeft) + toPx(cell.paddingRight),
    gap: toPx(chips.columnGap),
    iconWidth: toPx(tag.fontSize) + toPx(tag.columnGap),
    moreFont: toFont(more),
    tagFont: toFont(tag),
    tagInset:
      toPx(tag.paddingLeft) +
      toPx(tag.paddingRight) +
      toPx(tag.borderLeftWidth) +
      toPx(tag.borderRightWidth),
  };
  probe.remove();
  return styles;
}

// Chip widths for fitting `tag` / `tags` cells to their column (the shared TagCell's `fit`):
// text widths come from a canvas and are cached by text, so a cell costs a few Map reads and no
// DOM reads, and the styles are read once per table on first use. Widths round up by a pixel so
// a measured chip never ends up a fraction wider than its room.
function createChipMeasure() {
  let styles = null;
  let context = null;
  const cache = new Map();
  function init() {
    styles = readStyles();
    context = document.createElement('canvas').getContext('2d');
  }
  function textWidth(font, text) {
    const key = `${font}\n${text}`;
    let width = cache.get(key);
    if (width === undefined) {
      context.font = font;
      width = context.measureText(text).width;
      cache.set(key, width);
    }
    return width;
  }
  const measure = {
    get cellInset() {
      if (styles === null) init();
      return styles.cellInset;
    },
    get gap() {
      if (styles === null) init();
      return styles.gap;
    },
    tag({ label, icon }) {
      if (styles === null) init();
      const iconWidth = icon ? styles.iconWidth : 0;
      return Math.ceil(textWidth(styles.tagFont, label) + styles.tagInset + iconWidth) + 1;
    },
    more(text) {
      if (styles === null) init();
      return Math.ceil(textWidth(styles.moreFont, text)) + 1;
    },
  };
  return measure;
}

export default createChipMeasure;
