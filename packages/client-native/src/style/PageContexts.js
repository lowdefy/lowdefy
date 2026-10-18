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

import React from 'react';

import BreakpointContext from '../layout/BreakpointContext.js';
import PageStyleContext from './PageStyleContext.js';
import ThemeContext from '../theme/ThemeContext.js';

/**
 * Provides a page's breakpoint, style and theme contexts, as captured inside the page, to blocks
 * drawn outside its tree (a Screen's headerRight, which the shell's router draws in the header).
 */
const PageContexts = ({ children, value }) => (
  <ThemeContext.Provider value={value.theme}>
    <BreakpointContext.Provider value={value.breakpoint}>
      <PageStyleContext.Provider value={value.pageStyle}>{children}</PageStyleContext.Provider>
    </BreakpointContext.Provider>
  </ThemeContext.Provider>
);

export default PageContexts;
