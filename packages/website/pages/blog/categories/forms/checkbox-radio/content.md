# Working with Forms in Lowdefy

## Pt. 2: Checkboxes and Radio Selectors

Our previous post covered the versatility of TextInput blocks in Lowdefy.

The combination of checkboxes and radio selectors is another essential component in web forms.

## CheckboxSelector

The CheckboxSelector block allows a user to select multiple values from a list of options.

One major benefit of Lowdefy's implementation of checkboxes is its simplicity.
This can be clearly seen in the examples below:

```html
<div>
  <input type="checkbox" id="option1" name="option1" value="1" />
  <label for="option1">First</label>
</div>
<div>
  <input type="checkbox" id="option2" name="option2" value="2" />
  <label for="option2">Second</label>
</div>
<div>
  <input type="checkbox" id="option3" name="option3" value="3" />
  <label for="option3">Third</label>
</div>
```

```yaml
id: options
type: CheckboxSelector
properties:
  options:
    - label: First
      value: 1
    - label: Second
      value: 2
    - label: Third
      value: 3
```

The Lowdefy version takes up a lot less space, is much more readable, and much less redundant.

### CheckboxSwitch

While the CheckboxSelector block allows for multiple options, the CheckboxSwitch allows only a single boolean value (true/false).

This type of selector may be used to accept terms and conditions, or to consent to promotional communications.

## RadioSelector

The RadioSelector block allows the user to select a single value from a list of options.

Implementing this block is largely the same as the CheckboxSelector, with the sole difference being the block type.

```yaml
id: options
type: RadioSelector
properties:
  options:
    - label: First
      value: 1
    - label: Second
      value: 2
    - label: Third
      value: 3
```

## Learn More

Checkboxes and radio selectors are simple yet powerful tools in form design.
Lowdefy makes these elements easy to work with, with minimal code and consistent styling by default.

Our next post in this series will cover Lowdefy's dropdown selector blocks.

Start your own Lowdefy project to try out CheckboxSelector, CheckboxSwitch, and RadioSelector blocks.

```bash
pnpx lowdefy@4 init && pnpx lowdefy@4 dev
 # note: requires node v18 (or newer) and pnpm
```

Don't forget to look through our [docs](https://docs.lowdefy.com/CheckboxSelector) for more details on features and implementation.
