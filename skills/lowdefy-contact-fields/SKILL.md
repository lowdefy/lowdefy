---
name: lowdefy-contact-fields
description: Use when a form captures a person or organisation contact — names, email, phone, address — with consistent block choices, validation and stored shape.
kind: recipe
lowdefyVersion: 5.5.1
---

# Contact fields

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `input-blocks/phonenumberinput`, `input-blocks/textinput`, `operators/_regex`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `PhoneNumberInput` (`@lowdefy/blocks-antd`), `TextInput` (`@lowdefy/blocks-antd`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_regex` (`@lowdefy/operators-js`).
<!-- generated:reference:end -->

## Recipe

Must cover: the stored contact shape (`name`, `email`, `phone`, `address`), `PhoneNumberInput` for phone, email `validate` with `_regex`, lowercase/trim on save, and a shared `_ref` template for the field group.
