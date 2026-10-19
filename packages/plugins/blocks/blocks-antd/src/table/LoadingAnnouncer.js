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

import React, { useRef } from 'react';

import './tableLoading.css';

// A polite live region for screen readers (D17): "Loading rows" while the table first loads, then
// "N rows loaded". Later refreshes keep the message, so background refetches are not announced.
// The region is always rendered: a live region only announces changes after it is in the page.
function LoadingAnnouncer({ count, state }) {
  const messageRef = useRef('');
  if (state === 'initial') {
    messageRef.current = 'Loading rows';
  } else if (messageRef.current === 'Loading rows') {
    messageRef.current = `${count} ${count === 1 ? 'row' : 'rows'} loaded`;
  }
  return (
    <div aria-live="polite" className="lf-table-sr-only" data-lf-announcer="" role="status">
      {messageRef.current}
    </div>
  );
}

export default LoadingAnnouncer;
