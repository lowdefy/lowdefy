# Change Log

## 4.4.0

### Minor Changes

- bcfbb1a9b: Add autoClearSearchValue property to MultipleSelector block.

### Patch Changes

- @lowdefy/block-utils@4.4.0
- @lowdefy/helpers@4.4.0

## 4.3.2

### Patch Changes

- efefb8ca0: Fix elementId on MultipleSelector.
  - @lowdefy/block-utils@4.3.2
  - @lowdefy/helpers@4.3.2

## 4.3.1

### Patch Changes

- 3e574857c: Bug fix: Randomize popup dom element ids to better attach on block reuse on page.
  - @lowdefy/block-utils@4.3.1
  - @lowdefy/helpers@4.3.1

## 4.3.0

### Patch Changes

- @lowdefy/block-utils@4.3.0
- @lowdefy/helpers@4.3.0

## 4.2.2

### Patch Changes

- e4ec43505: Fix undefined property access in PhoneNumberInput component
  - @lowdefy/block-utils@4.2.2
  - @lowdefy/helpers@4.2.2

## 4.2.1

### Patch Changes

- a1f47d97c: Fix Github actions release.
- Updated dependencies [a1f47d97c]
  - @lowdefy/block-utils@4.2.1
  - @lowdefy/helpers@4.2.1

## 4.2.0

### Patch Changes

- @lowdefy/block-utils@4.2.0
- @lowdefy/helpers@4.2.0

## 4.1.0

### Minor Changes

- f14270465: Add Popover and TreeSelector blocks.

### Patch Changes

- f571e90da: Bug fix for `Pagination` block initial `pageSize` value.
- f9d00b4d3: Add `type` property to TextInput to set HTML5 input types.
- 5b3ccc958: Fix Pagination block skip state value. The skip value is now calculated from current and pageSize values if block value is changed using SetState.
  - @lowdefy/block-utils@4.1.0
  - @lowdefy/helpers@4.1.0

## 4.0.2

### Patch Changes

- 628c6e2f6: Bug fix on Breadcrumb.
- 126a61267: Add style property to Modal.
- 126a61267: Add showCount property to TextInput.
- 126a61267: Add notFoundContent and loadingPlaceholder properties to Selector and MultipleSelector.
- bbcf07a27: Bug fix on Pagination block.
  - @lowdefy/block-utils@4.0.2
  - @lowdefy/helpers@4.0.2

## 4.0.1

### Patch Changes

- @lowdefy/block-utils@4.0.1
- @lowdefy/helpers@4.0.1

## 4.0.0

### Patch Changes

- @lowdefy/block-utils@4.0.0
- @lowdefy/helpers@4.0.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-rc.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.14...v4.0.0-rc.15) (2023-12-05)

### Bug Fixes

- **blocks-antd:** Check if option exists before checking tag. ([a72688d](https://github.com/lowdefy/lowdefy/commit/a72688d687674e309f103244eacba9613938293a))

### Features

- Add cover content area to Card block. ([c8a75a9](https://github.com/lowdefy/lowdefy/commit/c8a75a9155c994cc96658933ca4d0b6a5b1afc74))

# [4.0.0-rc.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.14) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Change to controlled tab, closes [#1705](https://github.com/lowdefy/lowdefy/issues/1705) ([c804c18](https://github.com/lowdefy/lowdefy/commit/c804c18c7753782e301b7e1d077f27f4138939a7))
- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))
- **blocks-antd:** Mention html support in title schema. ([6929fa3](https://github.com/lowdefy/lowdefy/commit/6929fa3cc83ca50e4bdd38ce6dc9b1ceb7794ff0))
- **blocks-antd:** Set ant-tabs-tabpane-hidden class to display none. ([c354acb](https://github.com/lowdefy/lowdefy/commit/c354acb0e8937d9c025bb810d34914ca66d57fe1))
- **deps:** Revert less to 4.1.3. ([ea298c9](https://github.com/lowdefy/lowdefy/commit/ea298c9f49d0a30b7877f28c12cde944e2c1b803))

### Features

- **blocks-antd:** Add onFocus and onBlur events to inputs ([ac9f342](https://github.com/lowdefy/lowdefy/commit/ac9f342c6bcd2b0c5df940fc9cc4783013f44714))
- **blocks-antd:** Render HTML in tabs titles. ([28421cc](https://github.com/lowdefy/lowdefy/commit/28421cc2ae644f0924d876d1b276334e20cfdfa3))
- **blocks-antd:** Trigger onChange event when active key changes. ([0c1908e](https://github.com/lowdefy/lowdefy/commit/0c1908e2c4887c4b492a8a2c6994b0bf63eb02b7))

# [4.0.0-rc.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.12...v4.0.0-rc.13) (2023-11-17)

### Bug Fixes

- **blocks-antd:** Change to controlled tab, closes [#1705](https://github.com/lowdefy/lowdefy/issues/1705) ([c804c18](https://github.com/lowdefy/lowdefy/commit/c804c18c7753782e301b7e1d077f27f4138939a7))
- **blocks-antd:** Control tabs using setActiveKey method. ([1d2845c](https://github.com/lowdefy/lowdefy/commit/1d2845c3a73d8cf536fb081f5c61c823ec98375f))
- **blocks-antd:** Mention html support in title schema. ([6929fa3](https://github.com/lowdefy/lowdefy/commit/6929fa3cc83ca50e4bdd38ce6dc9b1ceb7794ff0))
- **blocks-antd:** Set ant-tabs-tabpane-hidden class to display none. ([c354acb](https://github.com/lowdefy/lowdefy/commit/c354acb0e8937d9c025bb810d34914ca66d57fe1))
- **deps:** Revert less to 4.1.3. ([ea298c9](https://github.com/lowdefy/lowdefy/commit/ea298c9f49d0a30b7877f28c12cde944e2c1b803))

### Features

- **blocks-antd:** Add onFocus and onBlur events to inputs ([ac9f342](https://github.com/lowdefy/lowdefy/commit/ac9f342c6bcd2b0c5df940fc9cc4783013f44714))
- **blocks-antd:** Render HTML in tabs titles. ([28421cc](https://github.com/lowdefy/lowdefy/commit/28421cc2ae644f0924d876d1b276334e20cfdfa3))
- **blocks-antd:** Trigger onChange event when active key changes. ([0c1908e](https://github.com/lowdefy/lowdefy/commit/0c1908e2c4887c4b492a8a2c6994b0bf63eb02b7))

# [4.0.0-rc.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.11...v4.0.0-rc.12) (2023-10-19)

### Bug Fixes

- Deepsource style fixes. ([e0804b8](https://github.com/lowdefy/lowdefy/commit/e0804b87999e6d812f2d2378770ed214d4264142))
- Deepsource style fixes. ([2086f5d](https://github.com/lowdefy/lowdefy/commit/2086f5d2e8e5665ec5fd16ce83e59119571f833d))

# [4.0.0-rc.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.10...v4.0.0-rc.11) (2023-10-06)

### Bug Fixes

- **blocks-antd:** Add onChange to DateTimeSelector. ([c0d0b87](https://github.com/lowdefy/lowdefy/commit/c0d0b8788e15359b341b37d4139763ccf40d25b7))
- **blocks-antd:** Fix Statistic decimalSeparator after ant design update. ([8a4c90c](https://github.com/lowdefy/lowdefy/commit/8a4c90c6da905a7bf5ee383edbb7e4a1e6f14be7))
- **blocks:** Add onTextSelection to Paragraph and document. ([7325633](https://github.com/lowdefy/lowdefy/commit/7325633d27adb876734e62140fc3e97b7e4ff119))
- **deps:** Dependencies patch updates. ([adcd80a](https://github.com/lowdefy/lowdefy/commit/adcd80afe8c752e15c900b88eb4d9be8526c7bcd))
- **deps:** Update dependency antd to v4.24.14 ([208acbe](https://github.com/lowdefy/lowdefy/commit/208acbebe44b98e1662deb974d4689d13de26536))
- **deps:** Update dependency rc-motion to v2.9.0. ([a8bf242](https://github.com/lowdefy/lowdefy/commit/a8bf242024ec88785fba3f7185ad31b4e8f4f3db))
- **deps:** Update dependency tinycolor2 to v1.6.0. ([0f21f87](https://github.com/lowdefy/lowdefy/commit/0f21f878c50bd5c67360d58606e42e4fd91faad8))

### Features

- **blocks-antd:** Add renderTags and option to render Tags in MultipleSelector. ([92a28fd](https://github.com/lowdefy/lowdefy/commit/92a28fd4ceb096257c4181a8ea0c5dd8bfbc8c2d))
- **blocks-antd:** Add Tag block. ([07d16cf](https://github.com/lowdefy/lowdefy/commit/07d16cfc31c34bc5f77e5ae76b4851f52f9bfda3))
- **blocks-antd:** Add Tag to docs. ([6a9a29e](https://github.com/lowdefy/lowdefy/commit/6a9a29e458eb52da6b65c8db5b1438ef592aa906))

# [4.0.0-rc.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.9...v4.0.0-rc.10) (2023-07-26)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-rc.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.8...v4.0.0-rc.9) (2023-05-31)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-rc.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.7...v4.0.0-rc.8) (2023-05-19)

### Bug Fixes

- **blocks-antd:** Add regex property to PhoneNumberInput block. ([c1e4080](https://github.com/lowdefy/lowdefy/commit/c1e4080476034704b105421a805e086c162a8e20))
- **blocks-antd:** Add regex property to TextInput block. ([548e7a9](https://github.com/lowdefy/lowdefy/commit/548e7a925bc440436a51c140249e9f85881327f7))
- **blocks-antd:** Rename regex property to replaceInput. ([cd811ae](https://github.com/lowdefy/lowdefy/commit/cd811ae6fae47a8384c73f439fd8fab86d0226ac))
- **blocks-antd:** Update PhoneNumberInput styles.less file to include Select styles. ([8bdd479](https://github.com/lowdefy/lowdefy/commit/8bdd479afdc5afb001c4b8f5485789a94a4aee50))

### Features

- **blocks-antd:** Add Carousel block to default Lowdefy blocks. ([85972d1](https://github.com/lowdefy/lowdefy/commit/85972d1d8e4f3fbd00ac55e386ef0f9a326bbdaa))

# [4.0.0-rc.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.6...v4.0.0-rc.7) (2023-03-24)

### Bug Fixes

- **blocks-antd:** Fix search on PhoneNumberInput block. ([6c97b69](https://github.com/lowdefy/lowdefy/commit/6c97b69064cc41e0bde0e6ba7f4730de135eeec7))

# [4.0.0-rc.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2023-03-20)

### Bug Fixes

- **blocks-antd:** Update Header and Sider blocks schemas ([6786cdb](https://github.com/lowdefy/lowdefy/commit/6786cdb899a69f2d117aef23bc63942ac4574dee))
- **blocks-antd:** Update PhoneNumberInput ([2cdfe2c](https://github.com/lowdefy/lowdefy/commit/2cdfe2cfa710b08eefeca9773f9aebd73b4b899e))
- Update PhoneNumberInput examples ([ae52024](https://github.com/lowdefy/lowdefy/commit/ae52024395ed5de697b796f5d9dce6943d3fb753))

### Features

- **blocks-antd:** Add PhoneNumberInput block. ([9ef0339](https://github.com/lowdefy/lowdefy/commit/9ef033913aa9726995cb9c3cd1e66cc6311413ba))
- **blocks-antd:** Add tests for PhoneNumberInput. ([eab2338](https://github.com/lowdefy/lowdefy/commit/eab23383d6e3460a68236c50b79e7bee180c6267))

# [4.0.0-rc.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2023-02-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-rc.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2023-02-21)

### Bug Fixes

- **deps:** Downgrade dependency antd to v4.22.5 ([ec0d911](https://github.com/lowdefy/lowdefy/commit/ec0d911f40282a8445cea0de2268373aadd02bd4))

# [4.0.0-rc.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2023-02-21)

### Bug Fixes

- **deps:** Downgrade dependency antd to v4.24.5 ([8602e71](https://github.com/lowdefy/lowdefy/commit/8602e719bda786c84086dd13a73287cefea7812a))

# [4.0.0-rc.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2023-02-17)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-rc.1](https://github.com/lowdefy/lowdefy/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2023-02-17)

### Bug Fixes

- **deps:** Update dependency @ant-design/icons ([497ff67](https://github.com/lowdefy/lowdefy/commit/497ff672a3f90c3fa00fa1d0839168a71702f456))
- **deps:** Update dependency antd to v4.24.7 ([1348a48](https://github.com/lowdefy/lowdefy/commit/1348a48f361168fa7eaa6b9c6dfa6f513dc139f4))
- **deps:** Update emotion css dependencies. ([7cc5588](https://github.com/lowdefy/lowdefy/commit/7cc5588d5936e7514f2e2a3400ce18f98d92586d))
- **deps:** Update minor versions of util packages. ([2d7a2a5](https://github.com/lowdefy/lowdefy/commit/2d7a2a55c88f0ee33eff49e5ff541f6296ec4337))
- **deps:** Update patch versions of dependencies ([9edaef7](https://github.com/lowdefy/lowdefy/commit/9edaef7e1aa940ff8aa795e60c25fb6369244ca9))
- **tests:** Fix jest mocks for es modules in connections. ([e3fadb2](https://github.com/lowdefy/lowdefy/commit/e3fadb2e4fe3bb4948b5f12a752f9356f20e8eb7))

# [4.0.0-rc.0](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.37...v4.0.0-rc.0) (2023-01-05)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.37](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.36...v4.0.0-alpha.37) (2022-12-07)

### Bug Fixes

- **blocks-antd:** DateTimePicker to use onSelect for better UX. ([6ea10cc](https://github.com/lowdefy/lowdefy/commit/6ea10cc437399c78f781746320e5f5d23cb6c2dd))
- **blocks-antd:** Import tooltip styles on Paragraph and Title for copy. ([ec3ad08](https://github.com/lowdefy/lowdefy/commit/ec3ad0876f4a31d6ee8cad708d9a807439326bb4))
- Fix Radio Selector not working for non-label/value fields. ([f3897c7](https://github.com/lowdefy/lowdefy/commit/f3897c7b63aa30d7b77953ba80e95ce31384b367))

### Features

- **blocks-antd:** Add parser property to NumberInput. ([95fbf13](https://github.com/lowdefy/lowdefy/commit/95fbf1301a59393d693b4f6480596ee17897b9c5))
- **blocks-antd:** Add parser to NumberInput schema file ([88aabdf](https://github.com/lowdefy/lowdefy/commit/88aabdfe08d530467898ed485d42d52a7de7e132))

# [4.0.0-alpha.36](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.35...v4.0.0-alpha.36) (2022-10-14)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.35](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.34...v4.0.0-alpha.35) (2022-10-05)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.34](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.33...v4.0.0-alpha.34) (2022-09-30)

### Bug Fixes

- **blocks-antd:** Breadcrumb should not render defaultTitle as label. ([a8762f0](https://github.com/lowdefy/lowdefy/commit/a8762f05a17e086b8e4ee62e1a67e9b0d46c64a7))
- **blocks-antd:** Fix breadcrumb icon size bug. ([c3b022f](https://github.com/lowdefy/lowdefy/commit/c3b022fd9fb67100f9cb5039500b0e9063930053))

# [4.0.0-alpha.33](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.32...v4.0.0-alpha.33) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.32](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.31...v4.0.0-alpha.32) (2022-09-22)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.31](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.30...v4.0.0-alpha.31) (2022-09-21)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.30](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.29...v4.0.0-alpha.30) (2022-09-17)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.29](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.28...v4.0.0-alpha.29) (2022-09-13)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.28](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.27...v4.0.0-alpha.28) (2022-09-12)

### Bug Fixes

- **blocks-antd:** Cleanup styles objects. ([c771cc9](https://github.com/lowdefy/lowdefy/commit/c771cc9a339a14b2f30dac65253f1b46178bba7d))
- **blocks-antd:** Fix issues in PageHeaderMenu and PageSiderMenu. ([81668f0](https://github.com/lowdefy/lowdefy/commit/81668f0e8a9452077c861fdc71cc40257de44bcc))

### Features

- **blocks-antd:** Add logo.srcMobile and logo.breakpoint properties. ([21bbeab](https://github.com/lowdefy/lowdefy/commit/21bbeabc2ce7b8cd81fd9904bc4a0735b4afdd9d))

# [4.0.0-alpha.27](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.26...v4.0.0-alpha.27) (2022-09-08)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.26](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.25...v4.0.0-alpha.26) (2022-08-25)

### Bug Fixes

- **blocks-antd:** Add class for feedback icon margin. ([1e29169](https://github.com/lowdefy/lowdefy/commit/1e29169774e9c70295573bc5051ee91aaeb5e5be))
- **blocks-antd:** Fix autocomplete bug when option is selected. ([2c02f08](https://github.com/lowdefy/lowdefy/commit/2c02f088e592b3a3cd1c48e22a515e655cddc098))
- **blocks-antd:** Fix feedback icon classes so that correct color is shown. ([c1f9b7d](https://github.com/lowdefy/lowdefy/commit/c1f9b7d8e61bfffa3e643955ef8d44468885babd))
- Fix extra bouncing when changing from displaying feedback to displaying extra. ([f5b70a4](https://github.com/lowdefy/lowdefy/commit/f5b70a4e371d01632a75d015ac18ab42a7901e62))
- Revert back to ant classes. ([8bdcfd5](https://github.com/lowdefy/lowdefy/commit/8bdcfd54d42dcffa57a88aaaafc00c6bbbdec850))

### Features

- **blocks-antd:** Add default suffix icon to date selectors. ([997fae8](https://github.com/lowdefy/lowdefy/commit/997fae855d901b36f2fe3e637b2b38ac7193158d))
- **blocks-antd:** Add feedback classes for corresponding colors. ([230570b](https://github.com/lowdefy/lowdefy/commit/230570b0008dfc627b85205d22545ae5f728e7ed))
- **blocks-antd:** Add feedback icon to TextInput and Selectors. ([f7f78e9](https://github.com/lowdefy/lowdefy/commit/f7f78e9aece55b5da3aa95c70b2a8a694db2487a))
- **blocks-antd:** Add feedback icon to WeekSelector. ([2719887](https://github.com/lowdefy/lowdefy/commit/2719887bde4019e109e0e57157389ecc48467fc8))
- **blocks-antd:** Add status to input components. ([91f7532](https://github.com/lowdefy/lowdefy/commit/91f753242b640c3722ef922632e77c5a23d2640b))
- **blocks-antd:** Change content to use named args. ([832f68c](https://github.com/lowdefy/lowdefy/commit/832f68c671e23c30f960792c8dd91164c6742f6a))
- **blocks-antd:** Change feedback icon to be added in label. ([91a1e8b](https://github.com/lowdefy/lowdefy/commit/91a1e8b5e44d8f0e3f7cbc4e945f5dca063de8db))
- **blocks-antd:** Cleanup AutoComplete. ([8732368](https://github.com/lowdefy/lowdefy/commit/8732368ac140a6c9782de942ef66d3b348651b3e))
- **blocks-antd:** Fix autocomplete bugs. ([71523cb](https://github.com/lowdefy/lowdefy/commit/71523cba4365b00ca7d1243a5f36ab77b4b073dc))
- **blocks-antd:** Replace ant feedback classes. ([51ba949](https://github.com/lowdefy/lowdefy/commit/51ba94947fd6b836408ba0dd2cc0fa7d9d42be62))

# [4.0.0-alpha.25](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.24...v4.0.0-alpha.25) (2022-08-23)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.24](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.23...v4.0.0-alpha.24) (2022-08-19)

### Bug Fixes

- **blocks-antd:** Center Label when inline. ([491e4a9](https://github.com/lowdefy/lowdefy/commit/491e4a99c85c106cfc8502ec3dddb8e5d14d73d3))
- **blocks-antd:** Fix RadioSelector not displaying which item is checked. ([8df75e6](https://github.com/lowdefy/lowdefy/commit/8df75e6136597f68f7073a0a26f92ff6a2a51d4a))
- **blocks-antd:** Remove minHight on Label. ([0999baa](https://github.com/lowdefy/lowdefy/commit/0999baaa22f476a01e14e769a30a81953a0b2faf))

# [4.0.0-alpha.23](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.22...v4.0.0-alpha.23) (2022-08-03)

### Bug Fixes

- **blocks-antd:** Remove minHight on Label. ([0999baa](https://github.com/lowdefy/lowdefy/commit/0999baaa22f476a01e14e769a30a81953a0b2faf))

# [4.0.0-alpha.22](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.21...v4.0.0-alpha.22) (2022-07-12)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.21](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.20...v4.0.0-alpha.21) (2022-07-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.20](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.19...v4.0.0-alpha.20) (2022-07-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.19](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.18...v4.0.0-alpha.19) (2022-07-06)

### Bug Fixes

- Menu selected item issue. ([ac266ec](https://github.com/lowdefy/lowdefy/commit/ac266ece5d7658a3e5e9c212f49b897a30dd278e))

# [4.0.0-alpha.18](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.17...v4.0.0-alpha.18) (2022-06-27)

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.14...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.17](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.16...v4.0.0-alpha.17) (2022-06-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.16](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.15...v4.0.0-alpha.16) (2022-06-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.15](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.15) (2022-06-19)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.14](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2022-06-19)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.13](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2022-06-16)

### Bug Fixes

- Update all packages to use @lowdefy/jest-yaml-transform. ([7bdf0a4](https://github.com/lowdefy/lowdefy/commit/7bdf0a4bb8ea972de7e4d4b82097a6fdaebfea56))

### Features

- Package updates. ([e024181](https://github.com/lowdefy/lowdefy/commit/e0241813d1276316f0f04897b664c43e24b11d23))
- React 18 update. ([55268e7](https://github.com/lowdefy/lowdefy/commit/55268e74ea08544ce816e85e205cd2093e0f2319))

# [4.0.0-alpha.12](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2022-05-23)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.11](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2022-05-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.10](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2022-05-06)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.9](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2022-05-06)

### Bug Fixes

- **blocks-antd:** Fix button color on focus. ([c56d1e4](https://github.com/lowdefy/lowdefy/commit/c56d1e40433127811b211f3c0736dde52124af1e))
- **blocks-antd:** Fix confirm modal button icons, closes [#1160](https://github.com/lowdefy/lowdefy/issues/1160) ([bba35be](https://github.com/lowdefy/lowdefy/commit/bba35be1dbb6a8e142f70b2415e865dba59de47b))
- **blocks-antd:** Fix menu keys. ([c6b8c69](https://github.com/lowdefy/lowdefy/commit/c6b8c69bb05c013d5112b89523424568faf34005))
- **blocks-antd:** Fix menu width wrapping. ([f71499c](https://github.com/lowdefy/lowdefy/commit/f71499cad248342e9a37584da56c0088aefcb62a))
- **blocks-antd:** Menu to show current selected page. ([72af09c](https://github.com/lowdefy/lowdefy/commit/72af09cf3dab6417d8ee6c0cdcbeec52ba092876))
- **blocks-antd:** remove onEnter and onInit events from schema descriptions. ([c0df169](https://github.com/lowdefy/lowdefy/commit/c0df1699276b6a922792a1d971ab6e596a5524e3))
- **blocks-antd:** Update snapshots. ([c4cc37a](https://github.com/lowdefy/lowdefy/commit/c4cc37acff9ade36a2db84ee395e2dbceb5a13d1))
- **blocks:** Fix icon names in examples. ([0d28534](https://github.com/lowdefy/lowdefy/commit/0d285347cdccd3a5f5c0531b5ee069d0e735287c))
- Fix bugs in icon and icon usage in docs. ([03858f4](https://github.com/lowdefy/lowdefy/commit/03858f43502404de39024b38fac1c5f87d5c99ca))

### Features

- **blocks-antd:** Remove color settings for menu, etc. ([bacaedb](https://github.com/lowdefy/lowdefy/commit/bacaedbbc8911b9ad4eaf36d2ecb7f60e536e331))
- **blocks-antd:** Update snapshots. ([5f5ef00](https://github.com/lowdefy/lowdefy/commit/5f5ef001c203b6c85564184683ece5fd968eea37))
- **blocks:** Add skeletons to blocks meta. ([ba34939](https://github.com/lowdefy/lowdefy/commit/ba349397359d4f54d7850536329ec0682ffcf89c))
- **blocks:** loading to render inputs but disable. ([1662f36](https://github.com/lowdefy/lowdefy/commit/1662f3668402bdce09a7ec814665525fc204f365))
- **blocks:** Remove loading prop from blocks. ([fc2def3](https://github.com/lowdefy/lowdefy/commit/fc2def366c7f23d09622a60e3d716f6c995ef4e6))
- **blocks:** Remove skeleton definition on blocks. ([f938a51](https://github.com/lowdefy/lowdefy/commit/f938a51268a7c0e5fa129c0628662890b635c8c7))

# [4.0.0-alpha.8](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2022-03-16)

### Bug Fixes

- **blocks-antd:** Fix Icon name in switch. ([96e5e46](https://github.com/lowdefy/lowdefy/commit/96e5e460d02ef4016a6bcfa2e613e8e8fe9eee01))
- **blocks-antd:** Icon name corrections. ([7fa29e4](https://github.com/lowdefy/lowdefy/commit/7fa29e4290d533f252390cf48f2059c178ca7c34))
- Revert back to react 17.0.2. ([1b38fd3](https://github.com/lowdefy/lowdefy/commit/1b38fd3e743ee7286468c7c1e2f623838dd5ed84))

# [4.0.0-alpha.7](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2022-02-21)

### Bug Fixes

- **blocks-antd:** Refactored tests to use new Block config. ([1919560](https://github.com/lowdefy/lowdefy/commit/191956023512213203b78f66bfcdebc451202eb0))
- **blocks-antd:** Temporary for schema for TimelineList. ([ce8640d](https://github.com/lowdefy/lowdefy/commit/ce8640d85b5ff7daa3610fe145a4569ec4c91777))
- **deps:** Update dependency react to v18.0.0-rc.0 ([2345330](https://github.com/lowdefy/lowdefy/commit/23453301716f541a1e044f63a740aae09d635237))
- **deps:** Update emotion css packages. ([3380594](https://github.com/lowdefy/lowdefy/commit/33805944e30e919c57e3e7e1876b9c6723c3988d))
- Fix V4 tests. ([d082d0c](https://github.com/lowdefy/lowdefy/commit/d082d0c335eb4426acadbf30a08de64266d9f004))
- Move S3UploadButton to plugin-aws. ([540aa03](https://github.com/lowdefy/lowdefy/commit/540aa035d2ed0672b0f3e233c1cee90e82d4bb52))

### Features

- **blocks:** Implement Link in blocks. ([2bcf600](https://github.com/lowdefy/lowdefy/commit/2bcf600bd1ae477325cf205069952006e3032b63))

# [4.0.0-alpha.6](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2022-01-20)

### Bug Fixes

- **blocks-antd:** Added debounce condition to Selector and MultipleSelector ([910bee0](https://github.com/lowdefy/lowdefy/commit/910bee0837ad1bd55d456f339a7750ed37aa5d0c))
- **blocks-antd:** Swap rc-animation for rc-motion in Label to fix modules build. ([8660b6e](https://github.com/lowdefy/lowdefy/commit/8660b6e1f00c4c28e4ed4b4500b982986c712864))
- **blocks:** Updated block meta, types and buildIcons. ([1d774a3](https://github.com/lowdefy/lowdefy/commit/1d774a310a71e125fc7bf7d0d7ef5171632a56a8))
- Fix antd styles. ([62a752d](https://github.com/lowdefy/lowdefy/commit/62a752d66c9b7cf4ebfd07fcc92d8a195ed43be4))
- Fix static files. ([d2e343e](https://github.com/lowdefy/lowdefy/commit/d2e343eb8b644d953babac628470e785af641237))

### Features

- 404 page working with next server ([270c92e](https://github.com/lowdefy/lowdefy/commit/270c92e16a42a5e9988b890f2abd41b16da6f673))

### BREAKING CHANGES

- The 404 page is now always publically accessible.

# [4.0.0-alpha.5](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2021-11-27)

### Bug Fixes

- Fixes for V4. ([41a9a30](https://github.com/lowdefy/lowdefy/commit/41a9a30b308543605a70f7d830a14f8f7221dd01))
- Refactored blocks for Lowdefy Version 4. ([96f194d](https://github.com/lowdefy/lowdefy/commit/96f194dc5088b864ee6696b97780a0791b5a5a2d))

# [4.0.0-alpha.4](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2021-11-25)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2021-11-25)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2021-11-25)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [4.0.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.23.1...v4.0.0-alpha.1) (2021-11-25)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.23.1](https://github.com/lowdefy/lowdefy/compare/v3.23.0...v3.23.1) (2021-11-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.23.0](https://github.com/lowdefy/lowdefy/compare/v3.23.0-alpha.0...v3.23.0) (2021-11-19)

### Bug Fixes

- **blocksAntd:** Update test snapshots for Selector and MultipleSelector. ([67202c4](https://github.com/lowdefy/lowdefy/commit/67202c452e2187d6c342cd1e5487c8d28b050004))
- Updated MultipleSelector block to include onSearch event. ([0339e63](https://github.com/lowdefy/lowdefy/commit/0339e63ab6ce3fb1c8c95d203e341cbec1eb4660))
- **blocksAntd:** Updated Selector block to include onSearch event. ([5e9ec14](https://github.com/lowdefy/lowdefy/commit/5e9ec1470d9920b8340247ac1ff8d9a681798f1d))

# [3.23.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0...v3.23.0-alpha.0) (2021-11-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.22.0](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.1...v3.22.0) (2021-09-27)

### Bug Fixes

- **blocksAntd:** Fix selector option labels and filter function. ([38445a5](https://github.com/lowdefy/lowdefy/commit/38445a58b626287868ad838d3b9885dccb7c720d))

# [3.22.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.22.0-alpha.0...v3.22.0-alpha.1) (2021-09-20)

### Bug Fixes

- **blocksAntd:** Add tests for CheckboxSwitch. ([089150e](https://github.com/lowdefy/lowdefy/commit/089150eacc67e4f27de5f763ad3656d52da40cad))
- **blocksAntd:** Added CheckboxSwitch tests. ([db8c05b](https://github.com/lowdefy/lowdefy/commit/db8c05b0ef546c460f41ab6e7e52de13eb54ff4b))
- **blocksAntd:** Fix CheckboxSwitch color property. ([d2ea3c6](https://github.com/lowdefy/lowdefy/commit/d2ea3c6a7f2d9f13e8a766c76e49a1b3a540d1d9))
- **blocksAntd:** Fix MultipleSelector schema and docs. ([41d25a1](https://github.com/lowdefy/lowdefy/commit/41d25a1e60f403a30824a00626605da37fc5bd3a))
- **blocksAntd:** Fix typo in Paragraph input copyable text property. ([b92621a](https://github.com/lowdefy/lowdefy/commit/b92621a8bae7be6e4d48165b8c54176d2403c592))
- **blocksAntd:** Paragraph and Title blocks copyable error fixed. ([483013d](https://github.com/lowdefy/lowdefy/commit/483013d1715cb97d08ed2f9475606c5b074a6ad3))
- **blocksAntd:** Updated CheckboxSwitch test snapshots. ([025a158](https://github.com/lowdefy/lowdefy/commit/025a1583e902b6edcb94c89ad272761eabd420fe))
- **blocksAntd:** Use updated renderHtml helper function ([5e3de6f](https://github.com/lowdefy/lowdefy/commit/5e3de6f5caa74e549b7f518895708b01a9191ee6)), closes [#820](https://github.com/lowdefy/lowdefy/issues/820)
- **blocksAntd:** Use updated renderHtml in selector blocks ([0da3bd1](https://github.com/lowdefy/lowdefy/commit/0da3bd19512cb0452ac7c559dce2e9ae499288de))

### Features

- **blocksAntd:** Added CheckboxSwitch demo example. ([7187849](https://github.com/lowdefy/lowdefy/commit/718784920d6e5daa69d30601cd88e7fadd94c5d4))
- **blocksAntd:** CheckboxSwitch block has been added. ([838f5ea](https://github.com/lowdefy/lowdefy/commit/838f5ea8852cff9f193e3e0a3dfb16b9c7f1da9e))

# [3.22.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.2...v3.22.0-alpha.0) (2021-09-08)

### Bug Fixes

- **blocksAntd:** Updated Password Input tests. ([7f32230](https://github.com/lowdefy/lowdefy/commit/7f322300b7888bc3de51d36483f06a1f68d5d74e))

### Features

- **blocksAntd:** Card block now has an onClick event. ([4263f6b](https://github.com/lowdefy/lowdefy/commit/4263f6b8764bb147e301c3dbba0ac4986959aad8))
- **blocksAntd:** Password Input block has been added. ([9d99ef8](https://github.com/lowdefy/lowdefy/commit/9d99ef82a930adb93b022c42ef765cf8a5022c70))

## [3.21.2](https://github.com/lowdefy/lowdefy/compare/v3.21.2-alpha.0...v3.21.2) (2021-08-31)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.21.2-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.21.1...v3.21.2-alpha.0) (2021-08-31)

### Bug Fixes

- **blocksAntd:** Fix blocks tooltip tests. ([b869fb0](https://github.com/lowdefy/lowdefy/commit/b869fb0f3c352ca6111b2974c719de9de76e8d71))
- **blocksAntd:** Fix undefined Tooltip title showing empty tooltip. ([358e423](https://github.com/lowdefy/lowdefy/commit/358e423bf10d35fab904267225c336749bfd4232))

## [3.21.1](https://github.com/lowdefy/lowdefy/compare/v3.21.0...v3.21.1) (2021-08-26)

### Bug Fixes

- **blocksAntd:** Fix Alert padding. ([9fb9686](https://github.com/lowdefy/lowdefy/commit/9fb9686cd2bfc9ed5028a44a24146d8c587a8ca2))

# [3.21.0](https://github.com/lowdefy/lowdefy/compare/v3.20.4...v3.21.0) (2021-08-25)

### Bug Fixes

- **blocksAntd:** Divider not to render empty title, closes [#790](https://github.com/lowdefy/lowdefy/issues/790) ([790fb89](https://github.com/lowdefy/lowdefy/commit/790fb89522538baccb8617d929dc7e3bcbe2e7fb))
- **blocksBasic:** Test change to new RenderHtml. ([ee9e3f0](https://github.com/lowdefy/lowdefy/commit/ee9e3f0d6150fdcd5ea42d0cfc1c0b6be8cc43a9))

## [3.20.4](https://github.com/lowdefy/lowdefy/compare/v3.20.3...v3.20.4) (2021-08-21)

### Bug Fixes

- **blocksAntd:** Fix Card block title area. ([475aef6](https://github.com/lowdefy/lowdefy/commit/475aef6a817068ee6734cba32b8b684c459e2a7c))
- **blocksAntd:** Fix Card title if no title is specified. ([60074f9](https://github.com/lowdefy/lowdefy/commit/60074f991d5893929cbf21fabe4b428e7eb4dc43))
- **blocksAntd:** Update Card block snapshot tests. ([4c67f41](https://github.com/lowdefy/lowdefy/commit/4c67f41f4299c107257efa1f7a34bc163f78c88f))
- **blocksAntd:** Update schema for Descriptions. ([50bf48c](https://github.com/lowdefy/lowdefy/commit/50bf48c6606ad327c989b34d58f0404406cbf2a3))

## [3.20.3](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.3) (2021-08-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.20.2](https://github.com/lowdefy/lowdefy/compare/v3.20.1...v3.20.2) (2021-08-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.20.1](https://github.com/lowdefy/lowdefy/compare/v3.20.0...v3.20.1) (2021-08-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.20.0](https://github.com/lowdefy/lowdefy/compare/v3.19.0...v3.20.0) (2021-08-20)

### Bug Fixes

- **blocks-antd:** Fix Descriptions block items schema ([525e8eb](https://github.com/lowdefy/lowdefy/commit/525e8eb8e3927e21e7b886cde0712ccb6d4c5b03))
- **blocks-antd:** Update snapshot tests for basePath ([5add1a7](https://github.com/lowdefy/lowdefy/commit/5add1a72a3bc341761be7aee0626b9e29a5ded67))
- Fixes for configurable basePath. ([63955bb](https://github.com/lowdefy/lowdefy/commit/63955bbd1131da3b27b537d4e0d72dc943119287))
- **blocksAntd:** Add additional properties to Descriptions and use RenderHtml. ([dfc468d](https://github.com/lowdefy/lowdefy/commit/dfc468d1fef7b9aebb611c82ff19285260bc5d7e))
- **blocksAntd:** Add blocks display type to Descriptions schema. ([bd78efc](https://github.com/lowdefy/lowdefy/commit/bd78efc0deb0702fb91bafd154f4aa64662d4f85))
- **blocksAntd:** Add option to define `showTotal` as a string or function. ([9ac3fc9](https://github.com/lowdefy/lowdefy/commit/9ac3fc9711df889a1d58d83a68ed2e6baf8f0946))
- **blocksAntd:** Added string output for ParagraphInput and TitleInput. ([5735bbf](https://github.com/lowdefy/lowdefy/commit/5735bbf1a51f9ea263797e62e69958cb9cfd5b3c))
- **blocksAntd:** Do not close modals and drawer if event is bounced. ([33814b0](https://github.com/lowdefy/lowdefy/commit/33814b04fd70bad08cdca50f40ee8b05f13de9e6))
- **blocksAntd:** Use relative paths with Link. ([f43762f](https://github.com/lowdefy/lowdefy/commit/f43762fc9eccd1876b0f240f3ea1ac64373238a3))
- **blockTools:** RenderHtml should default to display-inline block. ([dcaf615](https://github.com/lowdefy/lowdefy/commit/dcaf61575c09a9f253f1197826ff4ea60bdcd685))

### Features

- **blocksAntd:** Add support for html on all input Label title and extra. ([59979c7](https://github.com/lowdefy/lowdefy/commit/59979c7ed2afd9ffadb97f06d59fca323a1ac589))
- **blocksAntd:** Add support for html to Descriptions and refactor. ([6261355](https://github.com/lowdefy/lowdefy/commit/6261355f313a4d240407373c34c80608b4c1efd3))
- **blocksAntd:** Added onclose action chain error detection to ConfirmModal, Drawer, Modal. ([66e0692](https://github.com/lowdefy/lowdefy/commit/66e0692d9c9dc8a25be9115d2522e4cb77075c50))
- **blocksAntd:** options labels to support html. ([3533a96](https://github.com/lowdefy/lowdefy/commit/3533a96cb2031ba83932135a2d72fb554d9b9c12))
- **blocksAntd:** Selector option.label can be html. ([9200e34](https://github.com/lowdefy/lowdefy/commit/9200e3461ccb719f40578e9f2c15de12fe3c7053))
- Ability to use html in ConfirmModal, Divider, Message, Modal. ([ec69fb7](https://github.com/lowdefy/lowdefy/commit/ec69fb7ed8759c2d84302da87b25ece52c2988e2))
- Added ability to use html in Alert, Descriptions and Notification. ([efa61bd](https://github.com/lowdefy/lowdefy/commit/efa61bd7a08172938a56025b68ca15f08195a088))
- Added ability to use html in Button, Card and Collapse. ([6d4d696](https://github.com/lowdefy/lowdefy/commit/6d4d696ce35c327c22e014929e363aa8cc5c5954))
- Added ability to use html in Paragraph, Result and Statistic. ([483eee6](https://github.com/lowdefy/lowdefy/commit/483eee6eecacffe90f76221e5cb62ddaa07e2649))
- Added ability to use html in Title and Tooltip. ([9329d24](https://github.com/lowdefy/lowdefy/commit/9329d2487edda363a633eb4081914dd8fb7a1c9c))
- Updated antd blocks fields .json that support html. ([c9ae5e7](https://github.com/lowdefy/lowdefy/commit/c9ae5e745fe2010337228a6d6f75ca5903f0c0b0))

# [3.19.0](https://github.com/lowdefy/lowdefy/compare/v3.18.1...v3.19.0) (2021-07-26)

### Bug Fixes

- **blocksAntd:** Update Selector test snapshots. ([417e802](https://github.com/lowdefy/lowdefy/commit/417e802a89a9311578dad467c4580c502ec2c7c4))

### Features

- **blocks-antd:** Make Selector showSearch default true. ([6bf511a](https://github.com/lowdefy/lowdefy/commit/6bf511ab53ffc33676038a24f900aa0a5f30a0b6))

## [3.18.1](https://github.com/lowdefy/lowdefy/compare/v3.18.0...v3.18.1) (2021-06-30)

### Bug Fixes

- **blocksAntd:** Fix S3UploadButton block to new responses schema. ([37a15bf](https://github.com/lowdefy/lowdefy/commit/37a15bf6c56519565ef1b62e38dc021eeea71262))
- **blocksAntd:** Update snapshots. ([43b23f4](https://github.com/lowdefy/lowdefy/commit/43b23f484fd6a00a3029fa9fe6389f6a7f796097))

# [3.18.0](https://github.com/lowdefy/lowdefy/compare/v3.17.2...v3.18.0) (2021-06-17)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.17.2](https://github.com/lowdefy/lowdefy/compare/v3.17.1...v3.17.2) (2021-06-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.17.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0...v3.17.1) (2021-06-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.3...v3.17.0) (2021-06-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0-alpha.3](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.2...v3.17.0-alpha.3) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0-alpha.2](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.1...v3.17.0-alpha.2) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0-alpha.1](https://github.com/lowdefy/lowdefy/compare/v3.17.0-alpha.0...v3.17.0-alpha.1) (2021-06-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.17.0-alpha.0](https://github.com/lowdefy/lowdefy/compare/v3.16.5...v3.17.0-alpha.0) (2021-06-09)

### Bug Fixes

- **blocksAntd:** Add forceSubMenuRender property to menu. ([3f85e6e](https://github.com/lowdefy/lowdefy/commit/3f85e6e6de12e6c7210c8e8daf5a22d022bb69c7))
- **blocksAntd:** Include menu tests for working renders. ([b8fa4d0](https://github.com/lowdefy/lowdefy/commit/b8fa4d090c3ae25502e48a965a4538ebe84a4173))
- **blocksAntd:** Skip menu render test. ([5a321ec](https://github.com/lowdefy/lowdefy/commit/5a321ec7d3bf2a3b4580abbce94601c389e9d32b))

## [3.16.5](https://github.com/lowdefy/lowdefy/compare/v3.16.4...v3.16.5) (2021-05-31)

### Bug Fixes

- **deps:** update dependency classnames to v2.3.1 ([d4c7249](https://github.com/lowdefy/lowdefy/commit/d4c7249814a3b6180a1cce63c0dbbd635df3db10))
- **deps:** update dependency js-yaml to v4.1.0 ([d3954f3](https://github.com/lowdefy/lowdefy/commit/d3954f30dd719deca4bc1383ba23a351a1b3b60b))

## [3.16.4](https://github.com/lowdefy/lowdefy/compare/v3.16.3...v3.16.4) (2021-05-28)

### Bug Fixes

- **blocks-antd:** Fix selector index comparison. ([3f06fcd](https://github.com/lowdefy/lowdefy/commit/3f06fcde4b3e01c35e942c4b0ec0a430c5039b96))

## [3.16.3](https://github.com/lowdefy/lowdefy/compare/v3.16.2...v3.16.3) (2021-05-27)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.16.2](https://github.com/lowdefy/lowdefy/compare/v3.16.1...v3.16.2) (2021-05-26)

### Bug Fixes

- **blocks-antd:** Remove Descriptions example with failing schema ([7e45bb3](https://github.com/lowdefy/lowdefy/commit/7e45bb30bb5fa993e6a580eabf7e9ae049ffe18f))

## [3.16.1](https://github.com/lowdefy/lowdefy/compare/v3.16.0...v3.16.1) (2021-05-26)

### Bug Fixes

- **docs:** Fix Descriptions schema for docs generator. ([dbe1efe](https://github.com/lowdefy/lowdefy/commit/dbe1efec53930f5507abcebb54bc4d21e56ddc94))

# [3.16.0](https://github.com/lowdefy/lowdefy/compare/v3.15.0...v3.16.0) (2021-05-26)

### Bug Fixes

- fix indentation level op events in schema ([4426888](https://github.com/lowdefy/lowdefy/commit/44268886182657a95b7b1f4c1f2e7aa0ec63bcd1))
- **blocksAntd:** Add new-line support to Descriptions, closes [#581](https://github.com/lowdefy/lowdefy/issues/581) ([41bb9ee](https://github.com/lowdefy/lowdefy/commit/41bb9eee438b60d75efe00a433beb99ad98e78b8))
- **blocksAntd:** Fix DateTimeSelector to work for local or utc time, closes [#580](https://github.com/lowdefy/lowdefy/issues/580) # ([30a4764](https://github.com/lowdefy/lowdefy/commit/30a476460859f8b72198bad17ef892ef634cb24d))
- **blocksAntd:** Fix srcSet and media change width. ([4fb991a](https://github.com/lowdefy/lowdefy/commit/4fb991af415ab66dcdee59d233bf43d4c271f99c))
- **docs:** Document context initialization events for context blocks. ([a59bff5](https://github.com/lowdefy/lowdefy/commit/a59bff50f25b79d0468a4a6afc836f264c3263b2)), closes [#576](https://github.com/lowdefy/lowdefy/issues/576)
- Fix Tabs blocks events in schema. ([70a13af](https://github.com/lowdefy/lowdefy/commit/70a13af94d90c6c40276f77fefea8708e7040451)), closes [#576](https://github.com/lowdefy/lowdefy/issues/576)
- **blocksAntd:** Rename selectGMT to selectUTC for DateTimeSelector. ([e817fb1](https://github.com/lowdefy/lowdefy/commit/e817fb1900a66c38487632500302040acd206a46))

### Features

- new Tooltip block and tests ([8717767](https://github.com/lowdefy/lowdefy/commit/871776745a3a4beb60622bb5b3e5aca0a1454a94))

# [3.15.0](https://github.com/lowdefy/lowdefy/compare/v3.14.1...v3.15.0) (2021-05-11)

### Bug Fixes

- **blocksAntd:** Add square logo for mobile menu. Closes [#545](https://github.com/lowdefy/lowdefy/issues/545) ([296c7ec](https://github.com/lowdefy/lowdefy/commit/296c7ecb1ba4ad92684e64816d55cc2863014152))
- **blocksAntd:** Show warning before validation. Closes [#562](https://github.com/lowdefy/lowdefy/issues/562) ([7b4909b](https://github.com/lowdefy/lowdefy/commit/7b4909b07dd4560329aff6515d53c1f283fc9116))

## [3.14.1](https://github.com/lowdefy/lowdefy/compare/v3.14.0...v3.14.1) (2021-04-28)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.14.0](https://github.com/lowdefy/lowdefy/compare/v3.13.0...v3.14.0) (2021-04-26)

### Bug Fixes

- **blocksAntd:** Update snapshots. ([ed6b6e7](https://github.com/lowdefy/lowdefy/commit/ed6b6e76a7d8a2c3c81dc86c7ede82b2908e0fed))
- Make lgtm corrections. ([ef20857](https://github.com/lowdefy/lowdefy/commit/ef2085781aa245bf0d027ddec3511d949403bed9))

# [3.13.0](https://github.com/lowdefy/lowdefy/compare/v3.12.6...v3.13.0) (2021-04-16)

### Bug Fixes

- Update react, react-dom and react-test-renderer to v17.0.2 ([78969ab](https://github.com/lowdefy/lowdefy/commit/78969abd39e8b04a7cddb39472985da6da50c7b9))

## [3.12.6](https://github.com/lowdefy/lowdefy/compare/v3.12.5...v3.12.6) (2021-04-06)

### Bug Fixes

- **blocks-antd:** Fix Pagination block onChange. ([5813ff1](https://github.com/lowdefy/lowdefy/commit/5813ff198ccd730efaefab9ea6a1f0b9865c5f12))
- **blocks-antd:** Fix S3UploadButton state value. ([c11184e](https://github.com/lowdefy/lowdefy/commit/c11184e27b1a31908fbe3aac0055cfc4f1cd07aa))

## [3.12.5](https://github.com/lowdefy/lowdefy/compare/v3.12.4...v3.12.5) (2021-03-31)

### Bug Fixes

- **blocks-antd:** Fix S3UploadButton not uploading files. ([7005a8f](https://github.com/lowdefy/lowdefy/commit/7005a8f547f2d5390d7fe58e903c48d6704e7622))

## [3.12.4](https://github.com/lowdefy/lowdefy/compare/v3.12.3...v3.12.4) (2021-03-30)

### Bug Fixes

- **blocks-antd:** Fix S3UploadButton file uploads. ([2fa854b](https://github.com/lowdefy/lowdefy/commit/2fa854b1b0563f480dede2986e9f4b64868449e1))

## [3.12.3](https://github.com/lowdefy/lowdefy/compare/v3.12.2...v3.12.3) (2021-03-26)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.12.2](https://github.com/lowdefy/lowdefy/compare/v3.12.1...v3.12.2) (2021-03-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.12.1](https://github.com/lowdefy/lowdefy/compare/v3.12.0...v3.12.1) (2021-03-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.12.0](https://github.com/lowdefy/lowdefy/compare/v3.11.4...v3.12.0) (2021-03-24)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.11.4](https://github.com/lowdefy/lowdefy/compare/v3.11.3...v3.11.4) (2021-03-19)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.11.3](https://github.com/lowdefy/lowdefy/compare/v3.11.2...v3.11.3) (2021-03-12)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.11.2](https://github.com/lowdefy/lowdefy/compare/v3.11.1...v3.11.2) (2021-03-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

## [3.11.1](https://github.com/lowdefy/lowdefy/compare/v3.11.0...v3.11.1) (2021-03-11)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.11.0](https://github.com/lowdefy/lowdefy/compare/v3.10.2...v3.11.0) (2021-03-11)

### Bug Fixes

- **blocks-antd:** Fix Descriptions bordered property default value ([c2503e1](https://github.com/lowdefy/lowdefy/commit/c2503e167a4185cf23f38955f66e0664fc0c5b1a))

## [3.10.2](https://github.com/lowdefy/lowdefy/compare/v3.10.1...v3.10.2) (2021-02-25)

### Bug Fixes

- **blocksAntd:** Update modal schema. ([f2c6739](https://github.com/lowdefy/lowdefy/commit/f2c673921691132ff7935a2fcae52f0780e81464))

## [3.10.1](https://github.com/lowdefy/lowdefy/compare/v3.10.0...v3.10.1) (2021-02-19)

### Bug Fixes

- **blocks-antd:** Add data prop back to timeline list until lists get value from state ([71eb8be](https://github.com/lowdefy/lowdefy/commit/71eb8bef5c8e63fa7dd21e0f0820d50d7f8784d6))

# [3.10.0](https://github.com/lowdefy/lowdefy/compare/v3.9.0...v3.10.0) (2021-02-17)

### Bug Fixes

- **blocks:** Do not pass methods down to imported blocks. ([ff3f588](https://github.com/lowdefy/lowdefy/commit/ff3f588410a970a65523693f143ba9e80139f2f0))
- **blocks:** Update block tests. ([898fc3c](https://github.com/lowdefy/lowdefy/commit/898fc3c818fd9879a79b48fcc785398c33677731))
- **blocksAntd:** Fix icon in Notification. ([34c03fc](https://github.com/lowdefy/lowdefy/commit/34c03fc7f09c5c28717de059443c819cc1bbfa49))
- **deps:** Update dependency @ant-design/icons to v4.5.0. ([8382bbb](https://github.com/lowdefy/lowdefy/commit/8382bbba7b58ec022109e4d97d1944390a9c09cc))
- **deps:** Update dependency css-loader to v5.0.2. ([6dd6a82](https://github.com/lowdefy/lowdefy/commit/6dd6a82fa4e4975f201e0c22c6b5bf29cd0541e3))
- **deps:** Update dependency html-webpack-plugin to v5.1.0 ([d0dd688](https://github.com/lowdefy/lowdefy/commit/d0dd688816e3e9fc6ff56235698d3af4707eba5f))
- **deps:** Update dependency less to v4.1.1. ([19ec1e2](https://github.com/lowdefy/lowdefy/commit/19ec1e205154974005b741d4a77a89161fad308f))
- **deps:** Update dependency less-loader to v8.0.0. ([465727b](https://github.com/lowdefy/lowdefy/commit/465727bf5e6cd0377e61afa37a38e7e0a1a05e95))
- **deps:** Update dependency webpack to v5.22.0. ([bb9f69e](https://github.com/lowdefy/lowdefy/commit/bb9f69e29cbce728932ab512e12122ce3dc349cc))
- **deps:** Update dependency webpack-cli to v4.5.0. ([445d55c](https://github.com/lowdefy/lowdefy/commit/445d55ca12f720be9f09632a319c319323c7041c))

### Reverts

- fix(deps): Update dependency less to v4.1.1 to v3.13.0. ([2e09287](https://github.com/lowdefy/lowdefy/commit/2e09287f572f78b82eae43cd2f56ef75994a0356))

# [3.9.0](https://github.com/lowdefy/lowdefy/compare/v3.8.0...v3.9.0) (2021-02-16)

### Bug Fixes

- **blocksAntd:** Fix args.icon for Message. ([8a16504](https://github.com/lowdefy/lowdefy/commit/8a165048b8253f06a6c827426d9c5f4dd1e002dd))
- **blocksAntd:** Return the message function. ([6fb2aec](https://github.com/lowdefy/lowdefy/commit/6fb2aec2d82085dab4f6a406c6882b7cd7666ef8))
- **blocksAntd:** Update Timeline to work from value settings. ([c95009b](https://github.com/lowdefy/lowdefy/commit/c95009b44128f234d1c3f4848e823b1d9c4400e2))
- **docs:** Fix schemas for Context Pages. ([2700d68](https://github.com/lowdefy/lowdefy/commit/2700d68c7fd29ad89ba669fcab48ba816211cbcc))

# [3.8.0](https://github.com/lowdefy/lowdefy/compare/v3.7.2...v3.8.0) (2021-02-12)

### Bug Fixes

- **blocks:** Remove react router from render loop where not required. ([7b6970f](https://github.com/lowdefy/lowdefy/commit/7b6970f9b4fcc1b9e35771ba619fab890fa638f5))
- **blocks-antd:** Remove formatter option from Statistic block. ([4c6a3b8](https://github.com/lowdefy/lowdefy/commit/4c6a3b81310418b207521ca790d80ebfe2149f6c))
- **blocksAntd:** Fix Label areas.label bug. ([6bcd258](https://github.com/lowdefy/lowdefy/commit/6bcd2585268302938ab61010bd297a390e0f09aa))
- **blocksAntd:** Fix suffixIcon and label on MonthSelector. ([9547ff5](https://github.com/lowdefy/lowdefy/commit/9547ff5b147620837becea4e05d4b680b5115b0d))
- **blocksAntd:** PageSiderMenu affix toggle button. ([ae46923](https://github.com/lowdefy/lowdefy/commit/ae469234a8fd7daec47c3e9064234ba1bdeebffd))
- **blocksAntd:** PageSiderMenu clean up. ([340a760](https://github.com/lowdefy/lowdefy/commit/340a760a89c1286a7ec7c4e4b4b7457006cfcf49))
- **blocksAntd:** PageSiderMenu collapsed state should not open defaultOpenKeys. ([9172904](https://github.com/lowdefy/lowdefy/commit/91729047988323907c8ed0db4970be89a1c2c9d0))
- **blocksAntd:** Remove open property from Modal and Drawer. ([e5954ff](https://github.com/lowdefy/lowdefy/commit/e5954fffc71a55b4e883ef93d77f1bb439b68d66))
- **blocksAntd:** Update Anchor to use href spec. ([1b9a5b1](https://github.com/lowdefy/lowdefy/commit/1b9a5b1b4c43489be583968480403325c49fdca7))
- **docs:** Add container block docs. ([b490ec7](https://github.com/lowdefy/lowdefy/commit/b490ec767d6ab78c79f8b78836aee88f2f3b3f12))
- **docs:** Add context category block docs. ([39fb6c3](https://github.com/lowdefy/lowdefy/commit/39fb6c3b78eed52a114608186ad16b385cd43828))

## [3.7.2](https://github.com/lowdefy/lowdefy/compare/v3.7.1...v3.7.2) (2021-02-09)

### Bug Fixes

- Fix package lifecycle scripts. ([af7f3a8](https://github.com/lowdefy/lowdefy/commit/af7f3a8ea29763defb20cfb4f28afba3b56d981c))

## [3.7.1](https://github.com/lowdefy/lowdefy/compare/v3.7.0...v3.7.1) (2021-02-09)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.7.0](https://github.com/lowdefy/lowdefy/compare/v3.6.0...v3.7.0) (2021-02-09)

### Bug Fixes

- **blockDefaults:** Change allowClear default to false for TextArea and TextInput. ([30323ea](https://github.com/lowdefy/lowdefy/commit/30323eadf0bd573c7788302727ba5881caa4fe5e))
- **blocksAntd:** Fix Menu default open and selected keys. ([a1f48c5](https://github.com/lowdefy/lowdefy/commit/a1f48c5c1a93e5d47a08c6808416642598282d45))
- **blocksAntd:** Fix placeholder default for DateRangeSelector. ([03b03ad](https://github.com/lowdefy/lowdefy/commit/03b03addd6f07c55476d5db0055294e683ffa090))
- **blocksAntd:** Update styling for ControlledList. ([e5d773b](https://github.com/lowdefy/lowdefy/commit/e5d773b9f43eaaee2ba5d94ddd0c92c80f14e32d))

# [3.6.0](https://github.com/lowdefy/lowdefy/compare/v3.5.0...v3.6.0) (2021-02-05)

### Bug Fixes

- **blocksAntd:** PageHSCF events rename. ([ec4e9ed](https://github.com/lowdefy/lowdefy/commit/ec4e9edc41561414f11ddf62c2d0d0a63905578c))

### Features

- 🐢Redirect all paths to blocks-cdn. ([a45447a](https://github.com/lowdefy/lowdefy/commit/a45447ad1dacf977e487a020bd56080ae2b09792))

# [3.5.0](https://github.com/lowdefy/lowdefy/compare/v3.4.0...v3.5.0) (2021-02-05)

### Bug Fixes

- **blocks:** Add events to all subblocks. ([753ae60](https://github.com/lowdefy/lowdefy/commit/753ae60fc8a150ef2db3a243a2862841c6aad48b))
- **blocks:** Block schema fixes. ([34b5a11](https://github.com/lowdefy/lowdefy/commit/34b5a118024186e0a8ce241e5d05c0b26f84f710))
- **blocks:** Fix NumberInput to not apply default precision. ([f2ddcaa](https://github.com/lowdefy/lowdefy/commit/f2ddcaa7582515eb42464580888676789df73512))
- **blocks:** Fix port setting in webpack config. ([c828740](https://github.com/lowdefy/lowdefy/commit/c82874045dd041fbf3c3a8b4f5cb7dc27a05f39a))
- **blocks:** RatingSlider NA checkkbox to set NA value to state. ([a15693d](https://github.com/lowdefy/lowdefy/commit/a15693d566cee53f4d7c4f5e2461757f89bc7ee4))
- **blocks:** Update block schemas for all blocks. ([9a79743](https://github.com/lowdefy/lowdefy/commit/9a79743174935fd3eb02b3e777165e026e95c7ec))
- **blocks-antd:** Update snapshots for Avatar schema. ([784c0e9](https://github.com/lowdefy/lowdefy/commit/784c0e965f8455287f5b13f8a44c5386c75801ea))
- **blocksAntd:** Alert description only margin issue. Closes [#327](https://github.com/lowdefy/lowdefy/issues/327) ([864e74e](https://github.com/lowdefy/lowdefy/commit/864e74eff0a9b05eed90cd70081b9826b1ae95dc))
- **blocksAntd:** Correct disabledDates typo. Closes [#358](https://github.com/lowdefy/lowdefy/issues/358) ([558becf](https://github.com/lowdefy/lowdefy/commit/558becf243921b6494eaa99a2b307193253391a5))
- **blocksAntd:** Fix top padding on RatingSlider. ([48f9c13](https://github.com/lowdefy/lowdefy/commit/48f9c13962fdc71a815360c62b71c364ff405a8c))
- **blocksAntd:** Maintain cursor position for input blocks. Closes [#344](https://github.com/lowdefy/lowdefy/issues/344) ([7e90fed](https://github.com/lowdefy/lowdefy/commit/7e90fed8c6b12f51054d3c8bc4b3c93579ab097a))
- **deps:** Update dependency @and-design/icons to v4.4.0 ([9189eae](https://github.com/lowdefy/lowdefy/commit/9189eae785d8635cf1f84b17519450fc4f005900))
- **deps:** Update dependency copy-webpack-plugin to v7.0.0. ([901d412](https://github.com/lowdefy/lowdefy/commit/901d4126544dd4ee68d62bf520cdd4cc2b0d1dcc))
- **deps:** Update peer dependencies. ([57e5295](https://github.com/lowdefy/lowdefy/commit/57e52959b6ec507f4d060d8c7260a22761dca328))
- **docs:** Add default values and loading to blocks. ([fcadf76](https://github.com/lowdefy/lowdefy/commit/fcadf76edca9828c8bc0a511ca24cbbb20ccd219))
- **docs:** Convert propertiesFormTransform to work with objects. ([33042ba](https://github.com/lowdefy/lowdefy/commit/33042ba8e5a867338822ba1f4383bf458f801fa1))
- **docs:** Fix merge conflict and S3UploadButton examples ([e496d8c](https://github.com/lowdefy/lowdefy/commit/e496d8c8de04879fc59810ca66cf4182b3788997))
- **docs:** ParagraphInput remove content property. ([83d00ed](https://github.com/lowdefy/lowdefy/commit/83d00ed16c8bfd7b9cfed77c38190f1695cf9213))
- **docs:** Update Pagination tests. ([fa583f2](https://github.com/lowdefy/lowdefy/commit/fa583f23a63ce2c40bd08d5acf0b6a0cf5a0c56d))
- **docs:** Update snapshots for Avatar schema. ([0176a85](https://github.com/lowdefy/lowdefy/commit/0176a85f99ff84e7335a22e72943a52b818bdd6c))

### Features

- **blocks:** Add default block loading. ([d0d1801](https://github.com/lowdefy/lowdefy/commit/d0d1801490c486b19ec49ee9fd50395c9e02bb68))
- **blocks:** Fix disableDates in date selector schemas. ([b2763ee](https://github.com/lowdefy/lowdefy/commit/b2763ee2053df56a79c17e05998e643275e4bf4e))
- **blocks:** Update block schemas and tests. ([30636bd](https://github.com/lowdefy/lowdefy/commit/30636bd744f43652adcad51dd91570b53667dc04))
- **blocks-antd:** Rename block actions to events. ([9d9dce2](https://github.com/lowdefy/lowdefy/commit/9d9dce2ecfb4d9e37349b9f235a53d9724caee00))
- **docs:** Add Alert, Anchor, Avatar and Breadcrumb docs. ([0983607](https://github.com/lowdefy/lowdefy/commit/098360766d95789232050bce9cdfa72ed3405beb))
- **docs:** Add all Selectors. ([f5e65ab](https://github.com/lowdefy/lowdefy/commit/f5e65ab4068e7c6bd413026b2adecb4e4563761e))
- **docs:** Add blocks for Divider, Menu, Icon, Paragraph, Progress, Skeleton, Statistic. ([a2901ec](https://github.com/lowdefy/lowdefy/commit/a2901ec4b1d29a6973093db877a1ab1e741e4a17))
- **docs:** Add date selector docs. ([767f9ac](https://github.com/lowdefy/lowdefy/commit/767f9ac8f3ae0c0ac91bdcd12761c2155b0f5ec8))
- **docs:** Add docs for TextArea. ([102494e](https://github.com/lowdefy/lowdefy/commit/102494ea422bf980e0b1ab82a2535faab1311605))
- **docs:** Add NumberInput docs. ([b05cf14](https://github.com/lowdefy/lowdefy/commit/b05cf143fe687f51938019d235710bbbcd750359))
- **docs:** Add Pagination to docs. ([83a96ab](https://github.com/lowdefy/lowdefy/commit/83a96ab340d52038ddee03dce554e54af476b7df))
- **docs:** Add RatingSlider to docs. ([f64e363](https://github.com/lowdefy/lowdefy/commit/f64e363691d9e1c8a2ddde92f29c7f5f5d48681e))
- **docs:** Add S3UploadButton docs. ([c024488](https://github.com/lowdefy/lowdefy/commit/c024488b6b4d71e500c480889d1116cd6ef5266f))
- **docs:** Add Title block. ([adaa229](https://github.com/lowdefy/lowdefy/commit/adaa229df2e5d9c138770dfe289f9cdb80e9c1b5))
- **docs:** Add TitleInput and ParagraphInput. ([3e5b239](https://github.com/lowdefy/lowdefy/commit/3e5b2393227c579ea957380b78439ff016014385))
- **docs:** Update blocks page template to use transformers ([158539e](https://github.com/lowdefy/lowdefy/commit/158539ef517c4accd35ac3f77830dd43c781bf3c))
- **docs:** Update defaultValueTransformer to pull nested defaults from schemas. ([4ecb396](https://github.com/lowdefy/lowdefy/commit/4ecb3962ee9f4091f0e72975d816fa663940d3f8))
- **docs:** Use transformer fn to create properties from block schema ([faad65c](https://github.com/lowdefy/lowdefy/commit/faad65cae33e5ea92304a7fa854463a436c2557c))

# [3.4.0](https://github.com/lowdefy/lowdefy/compare/v3.3.0...v3.4.0) (2021-01-20)

**Note:** Version bump only for package @lowdefy/blocks-antd

# [3.3.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.3.0) (2021-01-18)

### Bug Fixes

- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))

# [3.2.0](https://github.com/lowdefy/lowdefy/compare/v3.1.1...v3.2.0) (2021-01-18)

### Bug Fixes

- **deps:** Update js-yaml from 3.14.1 to 4.0.0. ([1a9e1f9](https://github.com/lowdefy/lowdefy/commit/1a9e1f9e1057c14a3638bdd140de1b50d2721cd0))
- **deps:** Update package @wojtekmaj/enzyme-adapter-react-17 to v0.4.1 ([251102e](https://github.com/lowdefy/lowdefy/commit/251102e986b3e18804a8c94dbde2e93d3a7a85e9))

## [1.1.2](https://github.com/lowdefy/lowdefy/compare/@lowdefy/blocks-antd@1.1.0...@lowdefy/blocks-antd@1.1.2) (2020-12-15)

### Bug Fixes

- **blocks:** webpack --port setting should default to 3002 if no port provided ([ec1f5e8](https://github.com/lowdefy/lowdefy/commit/ec1f5e8a85bd2d326ecdb55a9a5ee628ff9034fa))
- **blocksAntd:** apply ant-form-small and ant-form-large classes to Label. ([1771590](https://github.com/lowdefy/lowdefy/commit/1771590d654a8a638a88ae7daa4d70b02f37fa0c))
- **blocksAntd:** Chagne Label height to 'fit-content' and apply min-height to solve long label overflow. ([69d131a](https://github.com/lowdefy/lowdefy/commit/69d131a76d62982e2bedb2a1b284fd56d39cffed))
- **blocksAntd:** Label height must only be applied to inline labels. ([b87c13b](https://github.com/lowdefy/lowdefy/commit/b87c13b644e52d644c37afc0171f6c1933facc0c))

## [1.1.1](https://github.com/lowdefy/lowdefy/compare/@lowdefy/blocks-antd@1.1.0...@lowdefy/blocks-antd@1.1.1) (2020-12-15)

### Bug Fixes

- **blocks:** webpack --port setting should default to 3002 if no port provided ([ec1f5e8](https://github.com/lowdefy/lowdefy/commit/ec1f5e8a85bd2d326ecdb55a9a5ee628ff9034fa))
- **blocksAntd:** apply ant-form-small and ant-form-large classes to Label. ([1771590](https://github.com/lowdefy/lowdefy/commit/1771590d654a8a638a88ae7daa4d70b02f37fa0c))
- **blocksAntd:** Chagne Label height to 'fit-content' and apply min-height to solve long label overflow. ([69d131a](https://github.com/lowdefy/lowdefy/commit/69d131a76d62982e2bedb2a1b284fd56d39cffed))
- **blocksAntd:** Label height must only be applied to inline labels. ([b87c13b](https://github.com/lowdefy/lowdefy/commit/b87c13b644e52d644c37afc0171f6c1933facc0c))

# 1.1.0 (2020-12-10)

### Bug Fixes

- **blocks:** do not need to target babel node ([6307e9d](https://github.com/lowdefy/lowdefy/commit/6307e9dcef098c12286ba494f650bc9b90ab0e63))
- **blocks:** pass --port option to webpack config ([e60ca16](https://github.com/lowdefy/lowdefy/commit/e60ca165927f3093aa60344b29de1d762fdb78c9))
- **blocksAntd:** remove Timeline and UserAvatar files ([7300e49](https://github.com/lowdefy/lowdefy/commit/7300e49ad94b80abf4aa9453ac5743c27065db44))
- **blocksAntd:** rename mutation to request in S3UploadButton ([f42a971](https://github.com/lowdefy/lowdefy/commit/f42a971bf68ef52c07ac684bd91d2a9f41bb86af))
- **blocksAntd:** set defined height to Label Col based on input size ([9d5c5ee](https://github.com/lowdefy/lowdefy/commit/9d5c5ee60fb816749fa2721682c3680981c398d2))
- **blocksAntd:** type in Button block ([958d760](https://github.com/lowdefy/lowdefy/commit/958d760eaa7b46296055aafd72a62753e91ced81))
- **blocksAntd:** update snapshots ([44b969e](https://github.com/lowdefy/lowdefy/commit/44b969e98ffa83b7e4575b81238690e0b19e7bb9))
- **blocksAntd:** update snapshots due to dep update ([eb75e50](https://github.com/lowdefy/lowdefy/commit/eb75e501771b3a7e7d33017bc006633a19877aeb))
- **blocksAntd:** update snapshots for inputs ([500ae5e](https://github.com/lowdefy/lowdefy/commit/500ae5e301d248e8d082e6501881e15f4f54dfc1))
- **blocksColorSelectors:** add license ([b66aba3](https://github.com/lowdefy/lowdefy/commit/b66aba33d8def92b673cd7932baa8d99e21a4af1))
- **blocksMarkdown:** fix cov paths, improve bad html test ([77211ec](https://github.com/lowdefy/lowdefy/commit/77211ec65b5a427176d095a2eb318bedc6f3d9fd))
- **deps:** update dependency js-yaml to v3.14.1 ([935ad89](https://github.com/lowdefy/lowdefy/commit/935ad894cd221901784360bee684189a60a2d386))
- **deps:** update dependency react-syntax-highlighter to v15.4.3 ([71d4621](https://github.com/lowdefy/lowdefy/commit/71d4621467d353e0543e743d9a37da8545d3c859))
- sanitizeName should use regex global ([af6b7b9](https://github.com/lowdefy/lowdefy/commit/af6b7b9e21b6eaa3cad8a1ce4d7b0e52b9effe42))
- **deps:** update dependency react-syntax-highlighter to v15.3.1 ([15df277](https://github.com/lowdefy/lowdefy/commit/15df277478013b223cb081bf4b148292afe0cea8))

### Features

- **blocks-antd:** use logos from server public assets ([780feeb](https://github.com/lowdefy/lowdefy/commit/780feebcd7bf1a0dc10e4468532f5d10cfaa22e9))
- **blocksAntd:** include es build ([2be5e10](https://github.com/lowdefy/lowdefy/commit/2be5e1072e1e11d273a9fad9b3b7142a0bd175b2))
- **blocksAntd:** mock tests for all files ([9012066](https://github.com/lowdefy/lowdefy/commit/901206629d1836b2a95402cf82da33b06ec72dcc))
- **blocksAntd:** S3UploadButton and basic render tests ([fd16e74](https://github.com/lowdefy/lowdefy/commit/fd16e74a377d7470d88530fa6ff74003a255f1a1))
- **blocksAntd:** S3UploadButton and basic render tests ([ca597f8](https://github.com/lowdefy/lowdefy/commit/ca597f84f1f3762eae6f7f5ee5feced688b809d0))
- **blocksAntd:** Spin and tests ([3b42bff](https://github.com/lowdefy/lowdefy/commit/3b42bffa4afbd6a045eb8256237ab1f93d7f0017))
- **blocksAntd:** Spin and tests ([0d47102](https://github.com/lowdefy/lowdefy/commit/0d4710252b35120bce4235a33a236dd73476e605))
- **blocksMarkdown:** init markdown blocks ([95eb2e4](https://github.com/lowdefy/lowdefy/commit/95eb2e4560788495e995f0b0343aae43b074fd02))
- **blockTools:** improve stubBlockProps with registerAction and actionLog ([fa3654c](https://github.com/lowdefy/lowdefy/commit/fa3654ccb3db8ec6c34591388253babca1c44e32))
- **blockTools:** improve stubBlockProps with registerAction and actionLog ([366dd91](https://github.com/lowdefy/lowdefy/commit/366dd91a48c2e96107b5397cf7839b0265208245))
- **servers:** add logos, favicons and pwa icons ([fc8610e](https://github.com/lowdefy/lowdefy/commit/fc8610e7f529071fd9ce3961b3991cab2d7911bd))
