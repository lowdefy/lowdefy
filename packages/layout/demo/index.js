import React from 'react';
import { render } from 'react-dom';

import AutoBlockSim from './AutoBlockSim';
import examples from './examples';
import { makeCss } from '../src';

// eslint-disable-next-line camelcase
const state = {
  a: null,
  b: null,
};

// eslint-disable-next-line no-undef
const documentCtx = document;

const Demo = () => (
  <div id="page">
    <div id="emotion" />
    <AutoBlockSim
      block={examples}
      state={state}
      areaKey="content"
      makeCss={makeCss}
      highlightBorders
    />
  </div>
);

export default Demo;

render(<Demo />, documentCtx.querySelector('#root'));
