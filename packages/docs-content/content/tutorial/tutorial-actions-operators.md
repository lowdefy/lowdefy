# 4. Interactive pages with actions and operators

If you have been following along, you can continue with your current config. Else, you can find the config from the previous section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/03-adding-blocks).

## Configuring the reset button

The reset button should reset all the user's inputs. To do this, we can add a [Reset action](/Reset) to the reset button.

#### 4.1. Configure the reset button

Copy the following into the definition of the reset button:

##### `new-ticket.yaml`
```yaml
id: new-ticket
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        # ...
        # ...
        # ...
      - id: reset_button
        type: Button
        layout:
          span: 12
        properties:
          title: Reset
          block: true
          icon: AiOutlineClear
################ -------- Copy from here -------- ################
        events:
          onClick:
            - id: reset
              type: Reset
################ -------- Copy to here ---------- ################
      - id: submit_button
        type: Button
        # ...
```

If you add some inputs into the form and click the reset button, those inputs should be cleared.

### How it works

Blocks can define events, which they can trigger when certain events happen on the page. You can then define a array of actions, that are executed sequentially when a block triggers an event. The button triggers an event called `onClick` when it gets clicked. We can add an array of action definitions that will be executed when this action is fired. We only added one action, the [`Reset` action](/Reset), that resets the page state as it was when it first loaded.

## Required fields

We should validate the form to make sure the user input data is clean for the app to work as expected. The `ticket_title` and `ticket_type` fields should be compulsory, and the user should not be able to submit the ticket if they are not completed.

#### 4.2. Mark fields as required

To make the fields required, add a required property to the input blocks like this:

```yaml
- id: ticket_title
  type: TextInput
  required: true
  properties:
    title: Title
```

A red asterisk should appear next to each input field, looking like this:

We can now add a [`Validate` action](/Validate) to the submit button. This will validate the inputs and give an error if any inputs are not filled in.

#### 4.3. Add a Validate action

Add the validate action like this:

##### `new-ticket.yaml`
```yaml
id: new-ticket
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        # ...
        # ...
        # ...
      - id: submit_button
        type: Button
        layout:
          span: 12
        properties:
          title: Submit
          block: true
          color: primary
          variant: solid
          icon: AiOutlineSave
################ -------- Copy from here -------- ################
        events:
          onClick:
            - id: validate
              type: Validate
################ -------- Copy to here ---------- ################
```

Now if we click the submit button and all our inputs aren't complete, a message pops up saying we have validation errors on the page. All the fields that have not been completed are highlighted in red.

The result should look and work like this. The examples in this tutorial are live versions of the tutorial app, so you can verify that they work like your own app.

Log a ticket

### How it works

The [Validate action](/Validate) we added to the submit button evaluates all the input blocks on the page, and gives an error if any of them fail the validation. This will also stop the execution of any actions after that action. For example, the app won't insert the data into our database if a Request action is used after a failing Validate action. The first time a Validate action is called on a page it sets a flag that tells all the input blocks to show their validation errors.

## Hiding blocks

We would like to ask the user if they had purchased the product within the last month, for which they are formulating a complaint. To do this, we will add a input block with a `visible` property. This property expects a boolean value. In Lowdefy, we can make use of [operators](/operators) to evaluate logic. We'll use the [`_eq`](/_eq) operator to test if the ticket type is equal to `Complaint`.

#### 4.4. Add a block with a visible condition

Add the following [`ButtonSelector`](/ButtonSelector) to your app.

##### `pages/new-ticket.yaml`
```yaml
id: new-ticket
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      # ...
      - id: ticket_description
        type: TextArea
        properties:
          title: Description
################ -------- Copy from here -------- ################
      - id: purchase_in_last_month
        type: ButtonSelector
        visible: # Test if block should be visible to the user
          _eq: # Equals operator
            - _state: ticket_type # Get the ticket_type value from state.
            - Complaint
        properties:
          title: Did you purchase this product within the last month?
          label:
            colon: false # Hide the label colon
          options:
            - Yes
            - No
################ -------- Copy to here ---------- ################
      - id: reset_button
        type: Button
```

If you select the "Complaint" ticket type, the selector confirming if you purchased the product within the last month should appear.

### How it works

If the visible field value is `false`, the block won't be rendered. To change this value while our app is running, we use an operator. [Operators](/operators) evaluate every time something in the app changes, like when a user provides an input.

We used the [`_eq`](/_eq) operator to check the ticket type is equal to 'Complaint'.

To get the value of the `ticket_type` input, we use the [`_state`](/_state) operator. This get a value from the page's [`state`](/page-and-app-state). The page `state` is an object to temporary store page data. All inputs automatically write their values to `state` under the object key of the block `id`, and you can also set values to the page `state` by using the [`SetState`](/SetState) action.

## Validation rules

We would like to add a validation rule on the `purchase_in_last_month` block to warn users that the product that they have purchased may not be eligible for replacement.

#### 4.5. Add a validation rule

Add the following to your app
##### `pages/new-ticket.yaml`
```yaml
id: new-ticket
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      # ...
      - id: purchase_in_last_month
        type: ButtonSelector
        visible: # Test if block should be visible to the user
          _eq: # Equals operator
            - _state: ticket_type # Get the ticket_type value from state.
            - Complaint
################ ------- Copy from here -------- ################
        validate:
          # Show a warning that shows before validate is called
          # and does not block Validate action.
          - status: warning
            message: If you have had the product for over a month, we may not be able to replace it.
            pass:
              _eq:
                - _state: confirm_restart
                - Yes
################ -------- Copy to here ---------- ################
        properties:
          title: Did you purchase this product within the last month?
          label:
            colon: false # Hide the label colon
          options:
            - Yes
            - No
```

Your app should now show a warning message if `purchase_in_last_month` is not yes.

### How it works

The `validate` field contains an array of validation rules that can be evaluated using operators.

If the pass field receives `true`, the rule passes and nothing happens. If the rule fails and the status is error, the `Validate` action will fail, like it did for required fields. If the status is warning, a warning will be shown to the user, but the `Validate` action will still pass.

Your final new ticket page should look and work like this:

Log a ticket

> You can find the final configuration files for this section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/04-interactive-pages).

## Up next

Our app doesn't save the form data anywhere when the submit button is clicked. In the next section we will set up a connection and a request to save the data in a local SQLite database.
