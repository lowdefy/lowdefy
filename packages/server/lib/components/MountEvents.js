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

const MountEvents = ({ children, context, parentLoading, triggerEvent, triggerEventAsync }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mounted = true;
    const mount = async () => {
      try {
        await triggerEvent();
        if (mounted) {
          triggerEventAsync();
          setLoading(false);
        }
      } catch (err) {
        setError(err);
      }
    };
    if (!parentLoading) {
      mount(); // TODO: check only run once.
    }
    return () => {
      mounted = false;
    };
  }, [context, parentLoading]);

  if (error) throw error;

  return <>{children(loading || parentLoading)}</>;
};

export default MountEvents;
