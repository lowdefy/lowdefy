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

import { PasteRule } from '@tiptap/core';

// A mark's paste rules (a pasted URL becoming a link, pasted **text** becoming
// bold, …) always ended the mark at the end of the pasted text in TipTap v2.
// v3 keeps an inclusive mark going when the match ends the paste, so text typed
// straight after a pasted URL joins the link. This takes the mark back out of
// the typing marks whenever a rule applies it, as v2 did.
function withV2PasteRules(extension) {
  return extension.extend({
    addPasteRules() {
      return (this.parent?.() ?? []).map(
        (rule) =>
          new PasteRule({
            find: rule.find,
            handler: (props) => {
              const result = rule.handler(props);
              // The mark rule returns null when it does not apply the mark.
              if (result !== null) {
                props.state.tr.removeStoredMark(this.type);
              }
              return result;
            },
          })
      );
    },
  });
}

export default withV2PasteRules;
