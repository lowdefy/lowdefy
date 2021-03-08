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
import getContext from '@lowdefy/engine';

import OnEnter from './OnEnter';

const Context = ({ block, contextId, pageId, render, lowdefy }) => {
  const [context, setContext] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const mount = async () => {
      try {
        const ctx = await getContext({
          block,
          contextId,
          pageId,
          lowdefy,
        });
        if (mounted) {
          setContext(ctx);
        }
      } catch (err) {
        setError(err);
      }
    };
    mount();
    return () => {
      mounted = false;
    };
  }, [block, pageId, lowdefy, contextId]);

  if (context.id !== contextId)
    return (
      <Loading
        properties={get(block, 'meta.loading.properties')}
        type={get(block, 'meta.loading.type')}
      />
    );

  if (error) throw error;

  return <OnEnter block={block} context={context} render={render} />;
};

export default Context;
