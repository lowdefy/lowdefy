/*
  Copyright 2020-2021 Lowdefy, Inc

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

import React, { useEffect, useState } from 'react';

import LoadingBlock from './LoadingBlock';

const triggerEvent = ({ name, context }) => {
  return context.RootBlocks.areas.root.blocks[0].triggerEvent({
    name,
  });
};

const OnEnter = ({ block, context, render, lowdefy }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mounted = true;
    const mount = async () => {
      try {
        await triggerEvent({ name: 'onEnter', context });
        if (mounted) {
          triggerEvent({ name: 'onEnterAsync', context });
          setLoading(false);
        }
      } catch (err) {
        setError(err);
      }
    };
    mount();
    return () => {
      mounted = false;
    };
  }, [context]);

  if (error) throw error;

  if (loading)
    return <LoadingBlock block={block} highlightBorders={lowdefy.lowdefyGlobal.highlightBorders} />;

  return render(context);
};

export default OnEnter;
