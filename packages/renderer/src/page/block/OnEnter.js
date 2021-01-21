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
import { Loading } from '@lowdefy/block-tools';
import { get } from '@lowdefy/helpers';

const callAction = ({ action, context }) => {
  return context.RootBlocks.areas.root.blocks[0].callAction({
    action,
  });
};

const OnEnter = ({ block, context, render }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mounted = true;
    const mount = async () => {
      try {
        await callAction({ action: 'onEnter', context });
        if (mounted) {
          callAction({ action: 'onEnterAsync', context });
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

  if (loading)
    return (
      <Loading
        properties={get(block, 'meta.loading.properties')}
        type={get(block, 'meta.loading.type')}
      />
    );

  if (error) throw error;

  return render(context);
};

export default OnEnter;
