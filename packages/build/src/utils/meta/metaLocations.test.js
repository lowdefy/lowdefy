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

import metaLocations from './metaLocations';
import packageJson from '../../../package.json';

const { version } = packageJson;

test('metaLocations default URL', async () => {
  expect(metaLocations({ version })).toEqual({
    Affix: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Affix.json`,
    },
    Alert: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Alert.json`,
    },
    Anchor: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Anchor.json`,
    },
    AutoComplete: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/AutoComplete.json`,
    },
    Avatar: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Avatar.json`,
    },
    Badge: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Badge.json`,
    },
    Box: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/Box.json`,
    },
    Breadcrumb: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Breadcrumb.json`,
    },
    Button: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Button.json`,
    },
    ButtonSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/ButtonSelector.json`,
    },
    Card: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Card.json`,
    },
    CheckboxSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/CheckboxSelector.json`,
    },
    CheckboxSwitch: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/CheckboxSwitch.json`,
    },
    ChromeColorSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/ChromeColorSelector.json`,
    },
    CircleColorSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/CircleColorSelector.json`,
    },
    Collapse: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Collapse.json`,
    },
    ColorSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/ColorSelector.json`,
    },
    Comment: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Comment.json`,
    },
    CompactColorSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/CompactColorSelector.json`,
    },
    ConfirmModal: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/ConfirmModal.json`,
    },
    Content: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Content.json`,
    },
    Context: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/Context.json`,
    },
    ControlledList: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/ControlledList.json`,
    },
    DangerousHtml: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/DangerousHtml.json`,
    },
    DangerousMarkdown: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-markdown/meta/DangerousMarkdown.json`,
    },
    DateRangeSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/DateRangeSelector.json`,
    },
    DateSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/DateSelector.json`,
    },
    DateTimeSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/DateTimeSelector.json`,
    },
    Descriptions: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Descriptions.json`,
    },
    Divider: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Divider.json`,
    },
    Drawer: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Drawer.json`,
    },
    EChart: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-echarts/meta/EChart.json`,
    },
    Footer: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Footer.json`,
    },
    GithubColorSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/GithubColorSelector.json`,
    },
    Header: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Header.json`,
    },
    Html: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/Html.json`,
    },
    Icon: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Icon.json`,
    },
    Img: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/Img.json`,
    },
    Label: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Label.json`,
    },
    Layout: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Layout.json`,
    },
    List: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/List.json`,
    },
    Markdown: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-markdown/meta/Markdown.json`,
    },
    MarkdownWithCode: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-markdown/meta/MarkdownWithCode.json`,
    },
    Menu: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Menu.json`,
    },
    Message: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Message.json`,
    },
    MobileMenu: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/MobileMenu.json`,
    },
    Modal: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Modal.json`,
    },
    MonthSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/MonthSelector.json`,
    },
    MultipleSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/MultipleSelector.json`,
    },
    Notification: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Notification.json`,
    },
    NumberInput: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/NumberInput.json`,
    },
    PageHCF: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageHCF.json`,
    },
    PageHCSF: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageHCSF.json`,
    },
    PageHSCF: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageHSCF.json`,
    },
    PageHeaderMenu: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageHeaderMenu.json`,
    },
    PageSHCF: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageSHCF.json`,
    },
    PageSiderMenu: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PageSiderMenu.json`,
    },
    Pagination: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Pagination.json`,
    },
    Paragraph: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Paragraph.json`,
    },
    ParagraphInput: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/ParagraphInput.json`,
    },
    PasswordInput: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/PasswordInput.json`,
    },
    Progress: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Progress.json`,
    },
    RadioSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/RadioSelector.json`,
    },
    RatingSlider: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/RatingSlider.json`,
    },
    Result: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Result.json`,
    },
    S3UploadButton: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/S3UploadButton.json`,
    },
    Selector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Selector.json`,
    },
    Skeleton: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Skeleton.json`,
    },
    Slider: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Slider.json`,
    },
    SliderColorSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/SliderColorSelector.json`,
    },
    Span: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-basic/meta/Span.json`,
    },
    Spin: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Spin.json`,
    },
    Statistic: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Statistic.json`,
    },
    SwatchesColorSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/SwatchesColorSelector.json`,
    },
    Switch: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Switch.json`,
    },
    Tabs: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Tabs.json`,
    },
    TextArea: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/TextArea.json`,
    },
    TextInput: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/TextInput.json`,
    },
    TimelineList: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/TimelineList.json`,
    },
    Title: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Title.json`,
    },
    TitleInput: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/TitleInput.json`,
    },
    Tooltip: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/Tooltip.json`,
    },
    TwitterColorSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-color-selectors/meta/TwitterColorSelector.json`,
    },
    UserAvatar: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/UserAvatar.json`,
    },
    WeekSelector: {
      url: `https://blocks-cdn.lowdefy.com/v${version}/blocks-antd/meta/WeekSelector.json`,
    },
  });
});

test('metaLocations configured URL', async () => {
  expect(metaLocations({ blocksServerUrl: 'https://blocks.server.com' })).toEqual({
    Affix: {
      url: 'https://blocks.server.com/blocks-antd/meta/Affix.json',
    },
    Alert: {
      url: 'https://blocks.server.com/blocks-antd/meta/Alert.json',
    },
    Anchor: {
      url: 'https://blocks.server.com/blocks-antd/meta/Anchor.json',
    },
    AutoComplete: {
      url: 'https://blocks.server.com/blocks-antd/meta/AutoComplete.json',
    },
    Avatar: {
      url: 'https://blocks.server.com/blocks-antd/meta/Avatar.json',
    },
    Badge: {
      url: 'https://blocks.server.com/blocks-antd/meta/Badge.json',
    },
    Box: {
      url: 'https://blocks.server.com/blocks-basic/meta/Box.json',
    },
    Breadcrumb: {
      url: 'https://blocks.server.com/blocks-antd/meta/Breadcrumb.json',
    },
    Button: {
      url: 'https://blocks.server.com/blocks-antd/meta/Button.json',
    },
    ButtonSelector: {
      url: 'https://blocks.server.com/blocks-antd/meta/ButtonSelector.json',
    },
    Card: {
      url: 'https://blocks.server.com/blocks-antd/meta/Card.json',
    },
    CheckboxSelector: {
      url: 'https://blocks.server.com/blocks-antd/meta/CheckboxSelector.json',
    },
    CheckboxSwitch: {
      url: 'https://blocks.server.com/blocks-antd/meta/CheckboxSwitch.json',
    },
    ChromeColorSelector: {
      url: 'https://blocks.server.com/blocks-color-selectors/meta/ChromeColorSelector.json',
    },
    CircleColorSelector: {
      url: 'https://blocks.server.com/blocks-color-selectors/meta/CircleColorSelector.json',
    },
    Collapse: {
      url: 'https://blocks.server.com/blocks-antd/meta/Collapse.json',
    },
    ColorSelector: {
      url: 'https://blocks.server.com/blocks-color-selectors/meta/ColorSelector.json',
    },
    Comment: {
      url: 'https://blocks.server.com/blocks-antd/meta/Comment.json',
    },
    CompactColorSelector: {
      url: 'https://blocks.server.com/blocks-color-selectors/meta/CompactColorSelector.json',
    },
    ConfirmModal: {
      url: 'https://blocks.server.com/blocks-antd/meta/ConfirmModal.json',
    },
    Content: {
      url: 'https://blocks.server.com/blocks-antd/meta/Content.json',
    },
    Context: {
      url: 'https://blocks.server.com/blocks-basic/meta/Context.json',
    },
    ControlledList: {
      url: 'https://blocks.server.com/blocks-antd/meta/ControlledList.json',
    },
    DangerousHtml: {
      url: 'https://blocks.server.com/blocks-basic/meta/DangerousHtml.json',
    },
    DangerousMarkdown: {
      url: 'https://blocks.server.com/blocks-markdown/meta/DangerousMarkdown.json',
    },
    DateRangeSelector: {
      url: 'https://blocks.server.com/blocks-antd/meta/DateRangeSelector.json',
    },
    DateSelector: {
      url: 'https://blocks.server.com/blocks-antd/meta/DateSelector.json',
    },
    DateTimeSelector: {
      url: 'https://blocks.server.com/blocks-antd/meta/DateTimeSelector.json',
    },
    Descriptions: {
      url: 'https://blocks.server.com/blocks-antd/meta/Descriptions.json',
    },
    Divider: {
      url: 'https://blocks.server.com/blocks-antd/meta/Divider.json',
    },
    Drawer: {
      url: 'https://blocks.server.com/blocks-antd/meta/Drawer.json',
    },
    EChart: {
      url: 'https://blocks.server.com/blocks-echarts/meta/EChart.json',
    },
    Footer: {
      url: 'https://blocks.server.com/blocks-antd/meta/Footer.json',
    },
    GithubColorSelector: {
      url: 'https://blocks.server.com/blocks-color-selectors/meta/GithubColorSelector.json',
    },
    Header: {
      url: 'https://blocks.server.com/blocks-antd/meta/Header.json',
    },
    Html: {
      url: 'https://blocks.server.com/blocks-basic/meta/Html.json',
    },
    Icon: {
      url: 'https://blocks.server.com/blocks-antd/meta/Icon.json',
    },
    Img: {
      url: 'https://blocks.server.com/blocks-basic/meta/Img.json',
    },
    Label: {
      url: 'https://blocks.server.com/blocks-antd/meta/Label.json',
    },
    Layout: {
      url: 'https://blocks.server.com/blocks-antd/meta/Layout.json',
    },
    List: {
      url: 'https://blocks.server.com/blocks-basic/meta/List.json',
    },
    Markdown: {
      url: 'https://blocks.server.com/blocks-markdown/meta/Markdown.json',
    },
    MarkdownWithCode: {
      url: 'https://blocks.server.com/blocks-markdown/meta/MarkdownWithCode.json',
    },
    Menu: {
      url: 'https://blocks.server.com/blocks-antd/meta/Menu.json',
    },
    Message: {
      url: 'https://blocks.server.com/blocks-antd/meta/Message.json',
    },
    MobileMenu: {
      url: 'https://blocks.server.com/blocks-antd/meta/MobileMenu.json',
    },
    Modal: {
      url: 'https://blocks.server.com/blocks-antd/meta/Modal.json',
    },
    MonthSelector: {
      url: 'https://blocks.server.com/blocks-antd/meta/MonthSelector.json',
    },
    MultipleSelector: {
      url: 'https://blocks.server.com/blocks-antd/meta/MultipleSelector.json',
    },
    Notification: {
      url: 'https://blocks.server.com/blocks-antd/meta/Notification.json',
    },
    NumberInput: {
      url: 'https://blocks.server.com/blocks-antd/meta/NumberInput.json',
    },
    PageHCF: {
      url: 'https://blocks.server.com/blocks-antd/meta/PageHCF.json',
    },
    PageHCSF: {
      url: 'https://blocks.server.com/blocks-antd/meta/PageHCSF.json',
    },
    PageHSCF: {
      url: 'https://blocks.server.com/blocks-antd/meta/PageHSCF.json',
    },
    PageHeaderMenu: {
      url: 'https://blocks.server.com/blocks-antd/meta/PageHeaderMenu.json',
    },
    PageSHCF: {
      url: 'https://blocks.server.com/blocks-antd/meta/PageSHCF.json',
    },
    PageSiderMenu: {
      url: 'https://blocks.server.com/blocks-antd/meta/PageSiderMenu.json',
    },
    Pagination: {
      url: 'https://blocks.server.com/blocks-antd/meta/Pagination.json',
    },
    Paragraph: {
      url: 'https://blocks.server.com/blocks-antd/meta/Paragraph.json',
    },
    ParagraphInput: {
      url: 'https://blocks.server.com/blocks-antd/meta/ParagraphInput.json',
    },
    PasswordInput: {
      url: 'https://blocks.server.com/blocks-antd/meta/PasswordInput.json',
    },
    Progress: {
      url: 'https://blocks.server.com/blocks-antd/meta/Progress.json',
    },
    RadioSelector: {
      url: 'https://blocks.server.com/blocks-antd/meta/RadioSelector.json',
    },
    RatingSlider: {
      url: 'https://blocks.server.com/blocks-antd/meta/RatingSlider.json',
    },
    Result: {
      url: 'https://blocks.server.com/blocks-antd/meta/Result.json',
    },
    S3UploadButton: {
      url: 'https://blocks.server.com/blocks-antd/meta/S3UploadButton.json',
    },
    Selector: {
      url: 'https://blocks.server.com/blocks-antd/meta/Selector.json',
    },
    Skeleton: {
      url: 'https://blocks.server.com/blocks-antd/meta/Skeleton.json',
    },
    Slider: {
      url: 'https://blocks.server.com/blocks-antd/meta/Slider.json',
    },
    SliderColorSelector: {
      url: 'https://blocks.server.com/blocks-color-selectors/meta/SliderColorSelector.json',
    },
    Span: {
      url: 'https://blocks.server.com/blocks-basic/meta/Span.json',
    },
    Spin: {
      url: 'https://blocks.server.com/blocks-antd/meta/Spin.json',
    },
    Statistic: {
      url: 'https://blocks.server.com/blocks-antd/meta/Statistic.json',
    },
    SwatchesColorSelector: {
      url: 'https://blocks.server.com/blocks-color-selectors/meta/SwatchesColorSelector.json',
    },
    Switch: {
      url: 'https://blocks.server.com/blocks-antd/meta/Switch.json',
    },
    Tabs: {
      url: 'https://blocks.server.com/blocks-antd/meta/Tabs.json',
    },
    TextArea: {
      url: 'https://blocks.server.com/blocks-antd/meta/TextArea.json',
    },
    TextInput: {
      url: 'https://blocks.server.com/blocks-antd/meta/TextInput.json',
    },
    TimelineList: {
      url: 'https://blocks.server.com/blocks-antd/meta/TimelineList.json',
    },
    Title: {
      url: 'https://blocks.server.com/blocks-antd/meta/Title.json',
    },
    TitleInput: {
      url: 'https://blocks.server.com/blocks-antd/meta/TitleInput.json',
    },
    Tooltip: {
      url: 'https://blocks.server.com/blocks-antd/meta/Tooltip.json',
    },
    TwitterColorSelector: {
      url: 'https://blocks.server.com/blocks-color-selectors/meta/TwitterColorSelector.json',
    },
    UserAvatar: {
      url: 'https://blocks.server.com/blocks-antd/meta/UserAvatar.json',
    },
    WeekSelector: {
      url: 'https://blocks.server.com/blocks-antd/meta/WeekSelector.json',
    },
  });
});
