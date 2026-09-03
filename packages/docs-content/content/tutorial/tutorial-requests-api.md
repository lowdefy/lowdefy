# 5. API / HTTP requests

If you have been following along, you can continue with your current config. Else, you can find the config from the previous section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/04-interactive-pages).

We will now add a `AxiosHttp` [connection and request](/connections-and-requests) to get the list of products that tickets can be logged for from an external API endpoint.

## Configuring the AxiosHttp Connection and Request

We want to add a [`Selector`](/Selector) block to our form that will allow the user to select which product they are logging a ticket about, from a preset list of options. This list of preset product options will be obtained from the [DummyJSON](https://dummyjson.com/) API.

For this, we will make use of an [`AxiosHttp`](/AxiosHttp) connection as described in the following steps:

#### 5.1. Adding a new connection to the app

In your `lowdefy.yaml` file, add the following:

##### `lowdefy.yaml`

```yaml
name: lowdefy-project-template
version: 5.5.1

################ -------- Copy from here -------- ################
connections:
  - id: dummy_api
    type: AxiosHttp
    properties:
      baseURL: https://dummyjson.com/
################ ------- Copy to here ----------- ################

menus:
  # ...
```

#### 5.2. Adding a request to the page

In your `new-ticket.yaml` file, add the following request:

##### `pages/new-ticket.yaml`

```yaml
id: new-ticket
type: PageHeaderMenu
################ -------- Copy from here -------- ################
requests:
  - id: get_products
    type: AxiosHttp
    connectionId: dummy_api
    properties:
      url: /products
################ ------- Copy to here ----------- ################

properties:
  title: New ticket # The title in the browser tab.
layout:
  justify: center # Center the contents of the page
blocks:
  # ...
```

#### 5.3. Triggering the request on page load

In your `new-ticket.yaml` file, add an onMount event that calls `get_products` request:

##### `pages/new-ticket.yaml`

```yaml
requests:
  - id: get_products
    type: AxiosHttp
    connectionId: dummy_api
    properties:
      url: /products

################ -------- Copy from here -------- ################
events:
  onMount:
    - id: fetch_products
      type: Request
      params: get_products
################ ------- Copy to here ----------- ################

properties:
  title: New ticket # The title in the browser tab.
layout:
  justify: center # Center the contents of the page
blocks:
  # ...
```

#### 5.4. Using the request response as selector options

In your `new-ticket.yaml` file, add the a Selector block and populate it with the results from the `get_products` request. We will make use of [`_array.map`](/_array#map_title) operator to get the product titles from the response obtained from the request. This is done as follows:

##### `pages/new-ticket.yaml`

```yaml
id: new-ticket
    # ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: Log a ticket # Change the title on the page.
          level: 3 # Make the title a little smaller (an html `<h3>`).
      - id: ticket_title
        type: TextInput
        properties:
          title: Title
      - id: ticket_type
        type: ButtonSelector
        properties:
          title: Ticket type
          options: # Set the allowed options
            - Suggestion
            - Complaint
            - Question

################ ------- Copy from here -------- ################
      - id: product
        type: Selector
        required: true
        properties:
          title: Product
          options:
            # Map over API response to create an array of product titles
            _array.map:
              # use dot notation to access value in response object properties
              - _request: get_products.data.products
              - _function:
                  __args: 0.title
################ ------- Copy to here -------- ################

      - id: ticket_description
        type: TextArea
        properties:
          title: Description
```

### What happened

We defined the [`AxiosHttp`](/AxiosHttp) connection to be used to obtain the list of products that tickets can be created for.

We also defined an [`AxiosHttp`](/AxiosHttp) request, to fetch the products data when the page is mounted. To do this, we used the onMount event to execute the Request action to make the API call.

We then mapped the request response to the product selector options by using the [_request](/_request) and [_array.map](/_array#map_title) operators.

> You can find the final configuration files for this section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/05-requests-api).

### Up next

Next we will save the form data to a SQLite database file.
