/*
  Copyright 2020 Lowdefy, Inc

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

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Blocks from '../src';
import Examples from './Examples';
import './app.css';

const Demo = () => {
  let blocks = Object.keys(Blocks);
  if (document.location.pathname[1] && Blocks[document.location.pathname.substring(1)]) {
    blocks = [document.location.pathname.substring(1)];
  }
  return (
    <div id="page">
      {blocks.map((key) => (
        <Examples key={key} type={key} Component={Blocks[key]} />
      ))}
    </div>
  );
};

export default Demo;

render(
  <BrowserRouter>
    <Demo />
  </BrowserRouter>,
  document.querySelector('#root')
);
