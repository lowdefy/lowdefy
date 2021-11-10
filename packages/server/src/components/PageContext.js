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

import { useEffect, useState } from 'react';
// import getContext from '@lowdefy/engine';
import getPageContext from './getPageContext.js';

// import MountEvents from './MountEvents';
const LoadingBlock = () => <div>Loading...</div>;

const Context = ({ children, lowdefy, pageConfig }) => {
  const [context, setContext] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const mount = async () => {
      try {
        const ctx = await getPageContext({
          pageConfig,
          lowdefy,
        });
        if (mounted) {
          setContext(ctx);
        }
      } catch (err) {
        // ??
        setError(err);
      }
    };
    mount();
    return () => {
      mounted = false;
    };
  }, [pageConfig, lowdefy]);

  // ??
  if (error) throw error;

  if (context.id !== pageConfig.pageId) return <LoadingBlock />;

  return children(context);

  // return (
  //   <MountEvents
  //     asyncEventName="onEnterAsync"
  //     context={context}
  //     eventName="onEnter"
  //     triggerEvent={({ name, context }) =>
  //       context.RootBlocks.areas.root.blocks[0].triggerEvent({ name })
  //     }
  //   >
  //     {(loaded) => (!loaded ? <LoadingBlock block={page} lowdefy={lowdefy} /> : children(context))}
  //   </MountEvents>
  // );
};

export default Context;
