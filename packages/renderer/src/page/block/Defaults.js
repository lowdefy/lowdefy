import React from 'react';
import { blockDefaults } from '@lowdefy/block-tools';

const Defaults = ({ Component, render }) => render(blockDefaults(Component));

export default Defaults;
