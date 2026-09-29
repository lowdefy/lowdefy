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

import loadTemplateCompiler from './loadTemplateCompiler.js';

// The template compiler when `needed` (null when the config uses none, or while it loads), for a
// block that renders its own skeleton while it waits (TableLight) instead of suspending.
function useTemplateCompiler({ needed }) {
  const record = needed ? loadTemplateCompiler() : null;
  const [, setLoaded] = useState(false);
  useEffect(() => {
    if (record === null || record.compile !== null) return undefined;
    let active = true;
    record.promise.then(() => {
      if (active) setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [needed]);
  if (record === null) return null;
  if (record.error !== null) throw record.error;
  return record.compile;
}

export default useTemplateCompiler;
