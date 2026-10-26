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

import { parse } from 'react-native-svg';
import { type } from '@lowdefy/helpers';

const SVG_DATA_URI = /^data:image\/svg\+xml[;,]/i;

// The bytes of a base64 payload read as UTF-8, which atob alone reads as Latin-1.
function decodeBase64(payload) {
  const binary = atob(payload);
  const escaped = Array.from(
    binary,
    (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`
  ).join('');
  return decodeURIComponent(escaped);
}

function readDataUri(src) {
  const comma = src.indexOf(',');
  if (comma < 0) {
    return null;
  }
  const header = src.slice(0, comma);
  const payload = src.slice(comma + 1);
  if (/;base64$/i.test(header)) {
    return decodeBase64(payload);
  }
  return decodeURIComponent(payload);
}

// react-native-svg reads alignment-baseline but not dominant-baseline, which generated avatars
// use to centre their initials; on a single line of text the two place it the same.
function copyDominantBaseline(node) {
  if (typeof node !== 'object') {
    return;
  }
  if (!type.isNone(node.props.dominantBaseline) && type.isNone(node.props.alignmentBaseline)) {
    node.props.alignmentBaseline = node.props.dominantBaseline;
  }
  node.children.forEach(copyDominantBaseline);
}

// A document sized in pixels with no viewBox draws at that size and is cropped, not scaled, to
// the avatar; a viewBox over the same size lets it scale.
function addViewBox(root) {
  const width = parseFloat(root.props.width);
  const height = parseFloat(root.props.height);
  if (type.isNone(root.props.viewBox) && width > 0 && height > 0) {
    root.props.viewBox = `0 0 ${width} ${height}`;
  }
}

function prepareSvg(root) {
  addViewBox(root);
  copyDominantBaseline(root);
  return root;
}

/**
 * What an avatar's `src` draws. An SVG data URI, such as the gradient-and-initials pictures
 * generated for people without a photo, is parsed here and drawn with react-native-svg: iOS's
 * image decoder draws SVG text at its alphabetic baseline and in the regular weight, so the
 * initials sit high and thin. Any other url is loaded, and cached, by expo-image, a path taken
 * against the app server (components.resolveUrl), as a browser on the app's page reads it.
 *
 * @param {Object} params
 * @param {(url: string) => string} params.resolveUrl
 * @param {string} [params.src]
 * @returns {{ kind: 'svg', ast: Object } | { kind: 'uri', uri: string } | null} null when there
 *   is no image to draw, or an SVG data URI does not parse; the avatar shows initials.
 */
function getAvatarImage({ resolveUrl, src }) {
  if (!type.isString(src) || src.trim() === '') {
    return null;
  }
  if (!SVG_DATA_URI.test(src)) {
    return { kind: 'uri', uri: resolveUrl(src) };
  }
  try {
    const xml = readDataUri(src);
    if (xml === null) {
      return null;
    }
    const ast = parse(xml, prepareSvg);
    return ast === null ? null : { kind: 'svg', ast };
  } catch (error) {
    return null;
  }
}

export default getAvatarImage;
