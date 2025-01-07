# Working with Forms in Lowdefy

## Pt. 1: Text

Lowdefy forms are extremely versatile, being able to capture every type of data imaginable, accurately, consistently, and effortlessly.

Whether you need a text box, dropdown, checkbox or date selector, input blocks are available right out of the box.

This series will provide more detail on each of these blocks and more, starting with TextInput.

## TextInput Blocks

Text boxes are a lot more useful than one may think.

Let's consider a form with 5 TextInput blocks.
The same type of block can be used for the following:

```yaml ldf
_ref: pages/blog/categories/forms/TextInput/text_form.yaml
```

```yaml ldf
id: text_form
type: Box
blocks:
  - id: First Name
    type: TextInput
    properties:
      type: text

  - id: last_name
    type: TextInput
    required: true
    properties:
      type: text

  - id: email_address
    type: TextInput
    required: true
    properties:
      type: email

  - id: password
    type: TextInput
    properties:
      type: password

  - id: phone_number
    type: PhoneNumberInput
```

Changing just a single property on each block gives them entirely different functionality.

The password field includes masked input, replacing the user's input with dots, and integrating with their password managers.

In addition to the examples shown above, an InputBlock's `type` property can be set to `url` or `number`.

There are a few special types of text input blocks with additional features.
The `PhoneNumberInput` block, for example, features a dropdown country selector for the dialing code.

```yaml ldf
_ref: pages/blog/categories/forms/TextInput/phone_input.yaml
```

```yaml

///
- id: Phone Number
  type: PhoneNumberInput
```

### Required Property

Marking a block as `required` adds the familiar red asterisk,
With the example above, the user would not be allowed to submit the form without entering a last name and email address.

## Learn More

TextInput is just one of the many input blocks available in Lowdefy.

Keep an eye out for the next entry in this series, covering checkboxes and radio selectors.

Start your own Lowdefy project to try out TextInput blocks.

```bash
pnpx lowdefy@4 init && pnpx lowdefy@4 dev
 # note: requires node v18 (or newer) and pnpm
```

Don't forget to look through our [docs](https://docs.lowdefy.com/TextInput) for more details on features and implementation.
