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

import { useEffect, useState } from 'react';
import getContext from '@lowdefy/engine';

const onEnter = (context) => {
  return context.RootBlocks.areas.root.blocks[0].callAction({
    action: 'onEnter',
    hideLoading: true,
  });
};

const fetchAll = (context) => {
  // fetch all new requests on page
  return context.Requests.callRequests({
    onlyNew: true,
  });
};

const useContext = ({ block, pageId, rootContext, contextId }) => {
  const [error, setError] = useState(null);
  const [context, setContext] = useState(null);
  useEffect(() => {
    let mounted = true;
    const mount = async () => {
      try {
        const ctx = await getContext({
          block,
          contextId,
          pageId,
          rootContext,
        });
        if (mounted) await onEnter(ctx);
        if (mounted) {
          fetchAll(ctx);
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
  }, [block, pageId, rootContext, contextId]);

  return { error, context, loading: !context && !error };
};

export default useContext;
