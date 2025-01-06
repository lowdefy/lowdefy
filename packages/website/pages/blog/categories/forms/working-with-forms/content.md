#draft

# Working with Forms in Lowdefy

Forms are an essential tool to collect user data and feedback.

> [!TIP]
> 10 Great uses for web forms

Lowdefy makes it easy to create powerful, intelligent forms with advanced functionality.

## Data Input

Forms in Lowdefy are very flexible, with an exhaustive list of input types available out of the box.

Each of these input block has its own list of optional properties, allowing for fine-grain customisation.

### Text

Lowdefy has 2 options for text: TextInput, for a single line, and TextArea for more detail or open-ended questions.

TextInput is not simply text input - text has many use cases, and Lowdefy config keeps these in mind.

`type: password` features masked input and integration with your password manager/s.
`type: tel` allows the user to select the country and include the correct dialing code.

### Numbers

Lowdefy also includes a specific `NumberInput` field.

This field can include +/- buttons for convenient incrementation, and the step can be set appropriately.
If a user wants to book a service based on duration, for example, the + button could add 20 minutes at a time, rather than just 1.

Numbers can include decimals if necessary, and be restricted to a certain range. A common requirement is that the user can only enter positive numbers, or perhaps we want to prevent users from claiming they are 6000 years old.

## Validation

Often we need the input to match a particular format.
`type: email` includes validation to ensure the input matches email format.

## UI & UX

Fields can be marked as required or disabled, with the familiar red asterisk or grey background and text respectively.
Another useful feature is the option for a button to clear the text during input, with the `allowClear` property.

In terms of styling, input fields have options for border, placeholder text, and label alignment and position.

## Get Started

This overview covers just a small sample of Lowdefy's form building features.
For more in-depth information, take a look at our documentation {link}, and play around with a Lowdefy project of your own.

```bash
pnpx lowdefy@4 init && pnpx lowdefy@4 dev
 # note: requires node v18 (or newer) and pnpm
```
