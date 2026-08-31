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

import React, { useEffect } from 'react';

// Replaces next/head for the single use in @lowdefy/client's Head.js:
// <Component><title>{properties.title}</title></Component>.
// Extracts the title text and sets document.title; renders nothing.
function Head({ children }) {
  useEffect(() => {
    React.Children.forEach(children, (child) => {
      if (child?.type === 'title') {
        const text = React.Children.toArray(child.props.children).join('');
        if (text) {
          document.title = text;
        }
      }
    });
  });
  return null;
}

export default Head;
