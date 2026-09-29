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

// The WCAG contrast of each chip's text on its own fill, both painted over the backgrounds behind
// the chip, keyed by the chip's text. Runs in the page (`locator.evaluateAll`), so it is
// self-contained.
function measureContrast(chips) {
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const paint = (colours) => {
    context.clearRect(0, 0, 1, 1);
    colours.forEach((colour) => {
      context.fillStyle = colour;
      context.fillRect(0, 0, 1, 1);
    });
    return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
  };
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };
  // The backgrounds from the page down to the element, outermost first, over the browser's
  // white canvas (a light page leaves html and body transparent).
  const backgrounds = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      layers.unshift(getComputedStyle(node).backgroundColor);
    }
    return ['#ffffff', ...layers];
  };
  const result = {};
  chips.forEach((chip) => {
    const layers = backgrounds(chip);
    const fill = paint(layers);
    const text = paint([...layers, getComputedStyle(chip).color]);
    result[chip.textContent.trim()] = Math.round(contrast(text, fill) * 100) / 100;
  });
  return result;
}

export default measureContrast;
