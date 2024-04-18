/*
  Copyright 2020-2024 Lowdefy, Inc

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

export default ({ version }) => `
lowdefy: ${version}
name: Lowdefy starter

pages:
  - id: welcome
    type: PageHeaderMenu
    properties:
      title: Welcome
    areas:
      content:
        justify: center
        blocks:
          - id: content_card
            type: Card
            style:
              maxWidth: 800
            blocks:
              - id: content
                type: Result
                properties:
                  title: Welcome to your Lowdefy app
                  subTitle: We are excited to see what you are going to build
                  icon:
                    name: AiOutlineHeart
                    color: '#f00'
                areas:
                  extra:
                    blocks:
                      - id: docs_button
                        type: Button
                        properties:
                          size: large
                          title: Let's build something
                          color: '#1890ff'
                        events:
                          onClick:
                            - id: link_to_docs
                              type: Link
                              params:
                                url: https://docs.lowdefy.com
                                newTab: true
      footer:
        blocks:
          - id: footer
            type: Paragraph
            properties:
              type: secondary
              content: |
                Made by a Lowdefy 🤖

`;
