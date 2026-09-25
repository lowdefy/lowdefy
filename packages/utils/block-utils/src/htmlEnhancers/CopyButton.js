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

import React, { useEffect, useRef, useState } from 'react';

const FEEDBACK_MS = 1500;

// The button handles its click natively and stops it there, so a copy inside
// an ag-grid row, an EventLog row, a data-event element or a link only copies:
// those listen natively or at the React root, which a synthetic
// stopPropagation reaches too late.
function CopyButton({ Icon, label, text, translate }) {
  const buttonRef = useRef(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const button = buttonRef.current;
    let timer = null;
    let mounted = true;
    function onClick(event) {
      event.preventDefault();
      event.stopPropagation();
      navigator.clipboard.writeText(text).then(
        () => {
          if (!mounted) return;
          setStatus('copied');
          clearTimeout(timer);
          timer = setTimeout(() => setStatus('idle'), FEEDBACK_MS);
        },
        () => {
          if (mounted) setStatus('failed');
        }
      );
    }
    button.addEventListener('click', onClick);
    return () => {
      mounted = false;
      clearTimeout(timer);
      button.removeEventListener('click', onClick);
    };
  }, [text]);

  let message = '';
  if (status === 'copied') message = translate('client.copied');
  if (status === 'failed') message = translate('client.copyFailed');
  return (
    <>
      <button ref={buttonRef} type="button" aria-label={label} data-tooltip={label}>
        <span aria-hidden="true">
          <Icon properties={{ name: status === 'copied' ? 'check' : 'copy', title: '' }} />
        </span>
      </button>
      <span role="status" data-lf-visually-hidden="">
        {message}
      </span>
    </>
  );
}

export default CopyButton;
