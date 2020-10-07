import createEmotion from 'create-emotion';
import { mergeObjects } from '@lowdefy/helpers';
import mediaToCssObject from './mediaToCssObject.js';

export const { css, injectGlobal } = createEmotion({
  container: document.getElementById('emotion'),
});

const makeCss = (styles, options = {}) =>
  options.styleObjectOnly
    ? mediaToCssObject(mergeObjects(styles), options)
    : css(mediaToCssObject(mergeObjects(styles), options));

export default makeCss;
