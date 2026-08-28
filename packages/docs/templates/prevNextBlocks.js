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

function navButton({ id, icon, item }) {
  return {
    id,
    type: 'Button',
    layout: {
      span: 12,
    },
    properties: {
      block: true,
      hideActionLoading: true,
      icon,
      size: 'large',
      title: item.title,
    },
    events: {
      onClick: [
        {
          id: `${id}_link`,
          type: 'Link',
          params: {
            pageId: item.pageId,
          },
        },
        {
          id: `${id}_scroll_to_top`,
          type: 'ScrollTo',
          params: {
            top: 0,
          },
        },
      ],
    },
  };
}

function navSpacer(id) {
  return {
    id,
    type: 'Box',
    layout: {
      span: 12,
    },
  };
}

// Build the prev/next footer strip injected by the menu transformer in
// generateSiteAssets.js. Mirrors the layout of the removed
// templates/navigation_buttons.yaml fragment.
function prevNextBlocks({ prev, next }) {
  return {
    id: 'prev_next_nav',
    type: 'Box',
    style: {
      marginTop: '40px',
      marginBottom: '40px',
    },
    layout: {
      gap: 16,
    },
    blocks: [
      prev
        ? navButton({ id: 'previous_page_button', icon: 'AiOutlineArrowLeft', item: prev })
        : navSpacer('previous_page_spacer'),
      next
        ? navButton({ id: 'next_page_button', icon: 'AiOutlineArrowRight', item: next })
        : navSpacer('next_page_spacer'),
    ],
  };
}

export default prevNextBlocks;
