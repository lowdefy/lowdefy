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

import avatarColor from '../format/avatarColor.js';
import initials from '../format/initials.js';
import replaceText from './replaceText.js';

// The text around the avatar, without the avatar itself.
function siblingText(element) {
  const parent = element.parentElement;
  if (parent === null) return '';
  return [...parent.childNodes]
    .filter((node) => node !== element)
    .map((node) => node.textContent)
    .join(' ');
}

// Next to the visible name an avatar is decorative; on its own it is named.
function isDecorative(element, name) {
  return siblingText(element).toLowerCase().includes(name.toLowerCase());
}

function labelInitials(element, name) {
  if (element.hasAttribute('aria-label') || element.hasAttribute('aria-hidden')) return;
  if (isDecorative(element, name)) {
    element.setAttribute('aria-hidden', 'true');
    return;
  }
  if (!element.hasAttribute('role')) {
    element.setAttribute('role', 'img');
  }
  element.setAttribute('aria-label', name);
}

function renderInitials(element, name) {
  labelInitials(element, name);
  element.style.setProperty('--lf-avatar-color', avatarColor(name));
  replaceText(element, initials(name));
}

// A broken or missing image is hidden and an initials avatar takes its place.
function replaceImage(image, name) {
  const fallback = image.ownerDocument.createElement('span');
  fallback.setAttribute('data-avatar', name);
  const shape = image.getAttribute('data-avatar-shape');
  if (shape !== null) {
    fallback.setAttribute('data-avatar-shape', shape);
  }
  image.hidden = true;
  image.after(fallback);
  renderInitials(fallback, name);
}

function prepareImage(image, name) {
  if (!image.hasAttribute('alt')) {
    image.setAttribute('alt', isDecorative(image, name) ? '' : name);
  }
  if (!image.getAttribute('src') || (image.complete && image.naturalWidth === 0)) {
    replaceImage(image, name);
    return null;
  }
  function onError() {
    replaceImage(image, name);
  }
  image.addEventListener('error', onError, { once: true });
  return () => image.removeEventListener('error', onError);
}

// data-avatar="Jane Doe" renders initials in a seeded theme colour, the same
// initials and colour as the grid's avatar cells. On an <img> the initials
// replace the image when it fails. No image service is called.
const avatarEnhancer = {
  name: 'avatar',
  attributes: ['data-avatar'],
  prepare({ select }) {
    const cleanups = [];
    select('[data-avatar]').forEach((element) => {
      const name = element.getAttribute('data-avatar').trim();
      if (element.tagName === 'IMG') {
        const cleanup = prepareImage(element, name);
        if (cleanup) cleanups.push(cleanup);
        return;
      }
      renderInitials(element, name);
    });
    if (cleanups.length === 0) return;
    return { cleanup: () => cleanups.forEach((cleanup) => cleanup()) };
  },
};

export default avatarEnhancer;
