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

import { createContext } from 'react';

// The view a Skeleton block's shapes measure themselves against: each shape places the shimmer
// band by its x in this frame, so the band crosses every shape of the block, and of the blocks
// beside it, as one sweep across the screen. A shape outside a Skeleton block (a loading Card)
// has no frame and sweeps from its own left edge.
const SkeletonFrameContext = createContext(null);

export default SkeletonFrameContext;
