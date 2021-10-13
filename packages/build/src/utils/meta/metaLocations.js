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

import { type } from '@lowdefy/helpers';

function metaLocations({ blocksServerUrl, context }) {
  let baseUrl = blocksServerUrl;
  const { version } = context;
  if (type.isNone(baseUrl)) {
    baseUrl = `https://blocks-cdn.lowdefy.com/v${version}`;
  }
  return {
    // @lowdefy/blocks-basic
    Context: {
      url: `${baseUrl}/blocks-basic/meta/Context.json`,
    },
    Box: {
      url: `${baseUrl}/blocks-basic/meta/Box.json`,
    },
    DangerousHtml: {
      url: `${baseUrl}/blocks-basic/meta/DangerousHtml.json`,
    },
    Html: {
      url: `${baseUrl}/blocks-basic/meta/Html.json`,
    },
    Img: {
      url: `${baseUrl}/blocks-basic/meta/Img.json`,
    },
    List: {
      url: `${baseUrl}/blocks-basic/meta/List.json`,
    },
    Span: {
      url: `${baseUrl}/blocks-basic/meta/Span.json`,
    },

    // @lowdefy/blocks-antd
    Affix: {
      url: `${baseUrl}/blocks-antd/meta/Affix.json`,
    },
    Alert: {
      url: `${baseUrl}/blocks-antd/meta/Alert.json`,
    },
    Anchor: {
      url: `${baseUrl}/blocks-antd/meta/Anchor.json`,
    },
    AutoComplete: {
      url: `${baseUrl}/blocks-antd/meta/AutoComplete.json`,
    },
    Avatar: {
      url: `${baseUrl}/blocks-antd/meta/Avatar.json`,
    },
    Badge: {
      url: `${baseUrl}/blocks-antd/meta/Badge.json`,
    },
    Breadcrumb: {
      url: `${baseUrl}/blocks-antd/meta/Breadcrumb.json`,
    },
    Button: {
      url: `${baseUrl}/blocks-antd/meta/Button.json`,
    },
    ButtonSelector: {
      url: `${baseUrl}/blocks-antd/meta/ButtonSelector.json`,
    },
    Card: {
      url: `${baseUrl}/blocks-antd/meta/Card.json`,
    },
    CheckboxSelector: {
      url: `${baseUrl}/blocks-antd/meta/CheckboxSelector.json`,
    },
    CheckboxSwitch: {
      url: `${baseUrl}/blocks-antd/meta/CheckboxSwitch.json`,
    },
    Collapse: {
      url: `${baseUrl}/blocks-antd/meta/Collapse.json`,
    },
    Comment: {
      url: `${baseUrl}/blocks-antd/meta/Comment.json`,
    },
    ConfirmModal: {
      url: `${baseUrl}/blocks-antd/meta/ConfirmModal.json`,
    },
    Content: {
      url: `${baseUrl}/blocks-antd/meta/Content.json`,
    },
    ControlledList: {
      url: `${baseUrl}/blocks-antd/meta/ControlledList.json`,
    },
    DateRangeSelector: {
      url: `${baseUrl}/blocks-antd/meta/DateRangeSelector.json`,
    },
    DateSelector: {
      url: `${baseUrl}/blocks-antd/meta/DateSelector.json`,
    },
    DateTimeSelector: {
      url: `${baseUrl}/blocks-antd/meta/DateTimeSelector.json`,
    },
    Descriptions: {
      url: `${baseUrl}/blocks-antd/meta/Descriptions.json`,
    },
    Divider: {
      url: `${baseUrl}/blocks-antd/meta/Divider.json`,
    },
    Drawer: {
      url: `${baseUrl}/blocks-antd/meta/Drawer.json`,
    },
    Footer: {
      url: `${baseUrl}/blocks-antd/meta/Footer.json`,
    },
    Header: {
      url: `${baseUrl}/blocks-antd/meta/Header.json`,
    },
    Icon: {
      url: `${baseUrl}/blocks-antd/meta/Icon.json`,
    },
    Label: {
      url: `${baseUrl}/blocks-antd/meta/Label.json`,
    },
    Layout: {
      url: `${baseUrl}/blocks-antd/meta/Layout.json`,
    },
    Menu: {
      url: `${baseUrl}/blocks-antd/meta/Menu.json`,
    },
    Message: {
      url: `${baseUrl}/blocks-antd/meta/Message.json`,
    },
    MobileMenu: {
      url: `${baseUrl}/blocks-antd/meta/MobileMenu.json`,
    },
    Modal: {
      url: `${baseUrl}/blocks-antd/meta/Modal.json`,
    },
    MonthSelector: {
      url: `${baseUrl}/blocks-antd/meta/MonthSelector.json`,
    },
    MultipleSelector: {
      url: `${baseUrl}/blocks-antd/meta/MultipleSelector.json`,
    },
    Notification: {
      url: `${baseUrl}/blocks-antd/meta/Notification.json`,
    },
    NumberInput: {
      url: `${baseUrl}/blocks-antd/meta/NumberInput.json`,
    },
    PageHCF: {
      url: `${baseUrl}/blocks-antd/meta/PageHCF.json`,
    },
    PageHCSF: {
      url: `${baseUrl}/blocks-antd/meta/PageHCSF.json`,
    },
    PageHeaderMenu: {
      url: `${baseUrl}/blocks-antd/meta/PageHeaderMenu.json`,
    },
    PageHSCF: {
      url: `${baseUrl}/blocks-antd/meta/PageHSCF.json`,
    },
    PageSHCF: {
      url: `${baseUrl}/blocks-antd/meta/PageSHCF.json`,
    },
    PageSiderMenu: {
      url: `${baseUrl}/blocks-antd/meta/PageSiderMenu.json`,
    },
    Pagination: {
      url: `${baseUrl}/blocks-antd/meta/Pagination.json`,
    },
    Paragraph: {
      url: `${baseUrl}/blocks-antd/meta/Paragraph.json`,
    },
    ParagraphInput: {
      url: `${baseUrl}/blocks-antd/meta/ParagraphInput.json`,
    },
    PasswordInput: {
      url: `${baseUrl}/blocks-antd/meta/PasswordInput.json`,
    },
    Progress: {
      url: `${baseUrl}/blocks-antd/meta/Progress.json`,
    },
    RadioSelector: {
      url: `${baseUrl}/blocks-antd/meta/RadioSelector.json`,
    },
    RatingSlider: {
      url: `${baseUrl}/blocks-antd/meta/RatingSlider.json`,
    },
    Result: {
      url: `${baseUrl}/blocks-antd/meta/Result.json`,
    },
    S3UploadButton: {
      url: `${baseUrl}/blocks-antd/meta/S3UploadButton.json`,
    },
    Selector: {
      url: `${baseUrl}/blocks-antd/meta/Selector.json`,
    },
    Slider: {
      url: `${baseUrl}/blocks-antd/meta/Slider.json`,
    },
    Skeleton: {
      url: `${baseUrl}/blocks-antd/meta/Skeleton.json`,
    },
    Spin: {
      url: `${baseUrl}/blocks-antd/meta/Spin.json`,
    },
    Statistic: {
      url: `${baseUrl}/blocks-antd/meta/Statistic.json`,
    },
    Switch: {
      url: `${baseUrl}/blocks-antd/meta/Switch.json`,
    },
    Tabs: {
      url: `${baseUrl}/blocks-antd/meta/Tabs.json`,
    },
    TextArea: {
      url: `${baseUrl}/blocks-antd/meta/TextArea.json`,
    },
    TextInput: {
      url: `${baseUrl}/blocks-antd/meta/TextInput.json`,
    },
    TimelineList: {
      url: `${baseUrl}/blocks-antd/meta/TimelineList.json`,
    },
    Title: {
      url: `${baseUrl}/blocks-antd/meta/Title.json`,
    },
    TitleInput: {
      url: `${baseUrl}/blocks-antd/meta/TitleInput.json`,
    },
    Tooltip: {
      url: `${baseUrl}/blocks-antd/meta/Tooltip.json`,
    },
    UserAvatar: {
      url: `${baseUrl}/blocks-antd/meta/UserAvatar.json`,
    },
    WeekSelector: {
      url: `${baseUrl}/blocks-antd/meta/WeekSelector.json`,
    },

    // @lowdefy/blocks-color-selectors-selectors
    ColorSelector: {
      url: `${baseUrl}/blocks-color-selectors/meta/ColorSelector.json`,
    },
    ChromeColorSelector: {
      url: `${baseUrl}/blocks-color-selectors/meta/ChromeColorSelector.json`,
    },
    CircleColorSelector: {
      url: `${baseUrl}/blocks-color-selectors/meta/CircleColorSelector.json`,
    },
    CompactColorSelector: {
      url: `${baseUrl}/blocks-color-selectors/meta/CompactColorSelector.json`,
    },
    GithubColorSelector: {
      url: `${baseUrl}/blocks-color-selectors/meta/GithubColorSelector.json`,
    },
    SliderColorSelector: {
      url: `${baseUrl}/blocks-color-selectors/meta/SliderColorSelector.json`,
    },
    SwatchesColorSelector: {
      url: `${baseUrl}/blocks-color-selectors/meta/SwatchesColorSelector.json`,
    },
    TwitterColorSelector: {
      url: `${baseUrl}/blocks-color-selectors/meta/TwitterColorSelector.json`,
    },
    // @lowdefy/blocks-markdown
    Markdown: {
      url: `${baseUrl}/blocks-markdown/meta/Markdown.json`,
    },
    MarkdownWithCode: {
      url: `${baseUrl}/blocks-markdown/meta/MarkdownWithCode.json`,
    },
    DangerousMarkdown: {
      url: `${baseUrl}/blocks-markdown/meta/DangerousMarkdown.json`,
    },
    // @lowdefy/blocks-echarts
    EChart: {
      url: `${baseUrl}/blocks-echarts/meta/EChart.json`,
    },
  };
}

export default metaLocations;
