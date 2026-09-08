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

// html-to-image embeds img.src and clones srcset/<source> attributes as-is:
// the selection the browser actually displays (img.currentSrc) is ignored, so
// a <picture> rasterizes its fallback src stretched into the displayed box
// (e.g. the PageHeaderMenu square logo warped into the wordmark's slot), and
// remote srcset candidates can't load inside the sandboxed SVG rasterization
// anyway. Pin every responsive image to its currentSrc for the capture — the
// URL the tab already displays, so nothing changes visually — and return a
// restore function for the caller's finally block.
function pinResponsiveImages() {
  const restores = [];

  document.querySelectorAll('img').forEach((img) => {
    const isResponsive =
      img.hasAttribute('srcset') || (img.currentSrc && img.currentSrc !== img.src);
    if (!img.currentSrc || !isResponsive) return;
    const src = img.getAttribute('src');
    const srcset = img.getAttribute('srcset');
    restores.push(() => {
      if (src === null) {
        img.removeAttribute('src');
      } else {
        img.setAttribute('src', src);
      }
      if (srcset !== null) {
        img.setAttribute('srcset', srcset);
      }
    });
    img.setAttribute('src', img.currentSrc);
    img.removeAttribute('srcset');
  });

  document.querySelectorAll('picture > source[srcset]').forEach((source) => {
    const srcset = source.getAttribute('srcset');
    restores.push(() => source.setAttribute('srcset', srcset));
    source.removeAttribute('srcset');
  });

  return function restore() {
    restores.forEach((fn) => fn());
  };
}

export default pinResponsiveImages;
