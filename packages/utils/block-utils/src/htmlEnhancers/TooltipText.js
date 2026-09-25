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

import { useEffect, useState } from 'react';

// The text of a data-tooltip attribute, kept current while the tooltip is
// open, so a control that changes its tooltip (a copy button saying "Copied")
// updates the open tooltip in place.
function TooltipText({ target }) {
  const [text, setText] = useState(() => target.getAttribute('data-tooltip'));
  useEffect(() => {
    const observer = new MutationObserver(() => setText(target.getAttribute('data-tooltip')));
    observer.observe(target, { attributes: true, attributeFilter: ['data-tooltip'] });
    return () => observer.disconnect();
  }, [target]);
  return text;
}

export default TooltipText;
