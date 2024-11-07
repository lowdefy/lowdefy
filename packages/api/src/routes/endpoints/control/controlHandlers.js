/*
  Copyright 2020-2024 Lowdefy, Inc

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

import controlIf from './controlIf.js';
import controlTry from './controlTry.js';
import controlReturn from './controlReturn.js';
import controlSetState from './controlSetState.js';
import controlThrow from './controlThrow.js';

function notImplemented(context) {
  context.logger.debug({ event: 'debug_control_not_implemented' });
}

const controlHandlers = {
  ':foreach': notImplemented,
  ':if': controlIf,
  ':log': notImplemented,
  ':parallel': notImplemented,
  ':reject': notImplemented,
  ':return': controlReturn,
  ':set_state': controlSetState,
  ':switch': notImplemented,
  ':throw': controlThrow,
  ':try': controlTry,
  ':while': notImplemented,
};

export default controlHandlers;
