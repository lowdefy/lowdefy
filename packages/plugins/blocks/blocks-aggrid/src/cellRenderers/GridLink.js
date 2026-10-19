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

const wrapperStyle = { display: 'contents' };

function isPlainClick(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

// A resolved cell link through the Lowdefy Link component, which builds the href (basePath and
// the page path included). A plain click emits onCellLink instead of navigating; it is caught on
// the wrapper in the capture phase, so the Link's own click handler, which would navigate and
// seed the target's input, never runs. Modified and new-tab clicks are left to the Link.
function GridLink({ link, components, methods, row, value, style, children }) {
  const { Link } = components;
  function onClickCapture(event) {
    if (link.newTab === true || !isPlainClick(event)) return;
    event.preventDefault();
    event.stopPropagation();
    methods?.triggerEvent?.({
      name: 'onCellLink',
      event: { link, row, value },
    });
  }
  return (
    <span style={wrapperStyle} onClickCapture={onClickCapture}>
      <Link
        pageId={link.pageId}
        pathParams={link.pathParams}
        urlQuery={link.urlQuery}
        href={link.href}
        home={link.home}
        back={link.back}
        newTab={link.newTab}
        style={style}
      >
        {children}
      </Link>
    </span>
  );
}

export default GridLink;
