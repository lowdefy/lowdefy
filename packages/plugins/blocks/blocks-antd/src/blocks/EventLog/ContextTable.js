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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import cssStyles from './style.module.css';

const COPIED_RESET_MS = 1400;
const errorKeys = /(^|\.)(reason|error|last_error|message|stack)$/i;

function ContextTable({ className, context, rows, style, text }) {
  const [copied, setCopied] = useState(false);
  const resetRef = useRef(null);
  useEffect(
    () => () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    },
    []
  );
  const copy = useCallback(async () => {
    // The clipboard API is missing outside secure contexts, and writes reject when permission is
    // denied or the document is not focused. The button then keeps its label instead of
    // claiming a copy that did not happen.
    if (type.isNone(navigator.clipboard)) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(context, null, 2));
    } catch {
      return;
    }
    setCopied(true);
    if (resetRef.current) clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, [context]);

  return (
    <div className={cn(cssStyles.context, className)} style={style}>
      <div className={cssStyles.contextHead}>
        <span className={cssStyles.contextLabel}>{text.context}</span>
        <button type="button" className={cssStyles.copyButton} onClick={copy}>
          {copied ? text.copied : text.copy}
        </button>
      </div>
      <dl className={cssStyles.keyValues}>
        {rows.map((row) => (
          <div className={cssStyles.keyValueRow} key={row.key}>
            <dt className={cssStyles.key}>{row.key}</dt>
            <dd
              className={cn(
                cssStyles.value,
                row.mono && cssStyles.valueMono,
                errorKeys.test(row.key) && cssStyles.valueError
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default ContextTable;
