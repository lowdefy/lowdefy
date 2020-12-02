/*
  Copyright 2020 Lowdefy, Inc

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

const scripts = new Set();

const useDynamicScript = ({ src }) => {
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!src) return;

    // Check if script is already added to DOM
    if (scripts.has(src)) {
      setReady(true);
      return;
    }

    const element = document.createElement('script');

    element.src = src;
    element.type = 'text/javascript';
    element.async = true;

    element.onload = () => {
      scripts.add(src);
      setReady(true);
    };

    element.onerror = (error) => {
      console.error(`Dynamic Script Error: ${src}`, error);
      setReady(false);
      setFailed(true);
    };

    document.head.appendChild(element);

    return () => {};
  }, [src]);

  return {
    ready,
    failed,
  };
};

export default useDynamicScript;
