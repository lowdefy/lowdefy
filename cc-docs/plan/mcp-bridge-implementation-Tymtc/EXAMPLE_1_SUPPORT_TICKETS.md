# Example 1: Customer Support Ticket System

A multi-page Lowdefy app where an agent creates support tickets, queries them, and updates their status — demonstrating form submission, data querying, cross-page state, and session persistence.

---

## The Lowdefy App Config

```yaml
# lowdefy.yaml
lowdefy: 4.0.0
name: Support Desk

auth:
  providers:
    - id: google
      type: GoogleProvider
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET
  pages:
    protected: true
    roles:
      support: [new_ticket, tickets, ticket_detail]
      admin: [new_ticket, tickets, ticket_detail, admin_dashboard]

connections:
  - id: ticketDb
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: tickets
      read: true
      write: true

  - id: notifyApi
    type: AxiosHttp
    properties:
      baseURL: https://hooks.slack.com
      headers:
        Content-Type: application/json

mcp:
  enabled: true
  transport: streamable-http
  port: 3001
  session:
    store:
      type: MongoDBSessionStore
      connectionId: ticketDb
      properties:
        collection: mcp_sessions
  auth:
    type: api_key

pages:
  # ── Page 1: Create New Ticket ──────────────────────
  - id: new_ticket
    type: PageSiderMenu
    properties:
      title: New Ticket
    areas:
      content:
        blocks:
          - id: form_card
            type: Card
            properties:
              title: Create Support Ticket
            areas:
              content:
                blocks:
                  - id: customer_email
                    type: TextInput
                    required: true
                    properties:
                      title: Customer Email
                      placeholder: customer@example.com

                  - id: priority
                    type: ButtonSelector
                    required: true
                    properties:
                      title: Priority
                      options:
                        - label: Low
                          value: low
                        - label: Medium
                          value: medium
                        - label: High
                          value: high
                        - label: Critical
                          value: critical

                  - id: category
                    type: Selector
                    required: true
                    properties:
                      title: Category
                      options:
                        - Billing
                        - Technical
                        - Account
                        - Feature Request

                  - id: subject
                    type: TextInput
                    required: true
                    properties:
                      title: Subject
                      placeholder: Brief description of the issue

                  - id: description
                    type: TextArea
                    required: true
                    properties:
                      title: Description
                      placeholder: Detailed description...
                      rows: 6

                  - id: submit_ticket
                    type: Button
                    properties:
                      title: Submit Ticket
                      type: primary
                      block: true
                      icon: AiOutlineSend
                    events:
                      onClick:
                        - id: validate
                          type: Validate
                        - id: save_ticket
                          type: Request
                          params: insert_ticket
                          messages:
                            loading: Creating ticket...
                            success: Ticket created!
                            error: Failed to create ticket
                        - id: notify_slack
                          type: Request
                          params: send_slack_notification
                        - id: store_ticket_id
                          type: SetGlobal
                          params:
                            lastTicketId:
                              _request: insert_ticket.insertedId

    requests:
      - id: insert_ticket
        type: MongoDBInsertOne
        connectionId: ticketDb
        payload:
          _state: true
        properties:
          doc:
            customer_email:
              _payload: customer_email
            priority:
              _payload: priority
            category:
              _payload: category
            subject:
              _payload: subject
            description:
              _payload: description
            status: open
            created_at:
              _date: now

      - id: send_slack_notification
        type: AxiosHttp
        connectionId: notifyApi
        properties:
          url: /services/T00/B00/xxx
          method: post
          data:
            text:
              _string.concat:
                - 'New ticket: '
                - _payload: subject
                - ' (Priority: '
                - _payload: priority
                - ')'

  # ── Page 2: Ticket List ────────────────────────────
  - id: tickets
    type: PageSiderMenu
    properties:
      title: All Tickets
    events:
      onMount:
        - id: fetch_tickets
          type: Request
          params: get_tickets
    areas:
      content:
        blocks:
          - id: filter_card
            type: Card
            properties:
              title: Filters
            areas:
              content:
                blocks:
                  - id: status_filter
                    type: ButtonSelector
                    properties:
                      title: Status
                      options:
                        - label: All
                          value: all
                        - label: Open
                          value: open
                        - label: In Progress
                          value: in_progress
                        - label: Resolved
                          value: resolved
                  - id: apply_filter
                    type: Button
                    properties:
                      title: Apply Filter
                    events:
                      onClick:
                        - id: refetch
                          type: Request
                          params: get_tickets

          - id: tickets_table
            type: AgGridAlpine
            properties:
              theme: balham
              columnDefs:
                - headerName: Subject
                  field: subject
                  flex: 2
                - headerName: Customer
                  field: customer_email
                  flex: 1
                - headerName: Priority
                  field: priority
                  width: 100
                - headerName: Status
                  field: status
                  width: 120
                - headerName: Created
                  field: created_at
                  width: 150
              rowData:
                _request: get_tickets

    requests:
      - id: get_tickets
        type: MongoDBFind
        connectionId: ticketDb
        payload:
          _state: true
        properties:
          query:
            _if:
              test:
                _eq:
                  - _payload: status_filter
                  - all
              then: {}
              else:
                status:
                  _payload: status_filter
          options:
            sort:
              created_at: -1
            limit: 50

  # ── Page 3: Ticket Detail ──────────────────────────
  - id: ticket_detail
    type: PageSiderMenu
    properties:
      title: Ticket Detail
    events:
      onMount:
        - id: load_ticket
          type: Request
          params: get_ticket
    areas:
      content:
        blocks:
          - id: ticket_info
            type: Descriptions
            properties:
              items:
                - label: Subject
                  value:
                    _request: get_ticket.subject
                - label: Customer
                  value:
                    _request: get_ticket.customer_email
                - label: Priority
                  value:
                    _request: get_ticket.priority
                - label: Current Status
                  value:
                    _request: get_ticket.status

          - id: new_status
            type: ButtonSelector
            properties:
              title: Update Status
              options:
                - label: Open
                  value: open
                - label: In Progress
                  value: in_progress
                - label: Resolved
                  value: resolved
                - label: Closed
                  value: closed

          - id: internal_note
            type: TextArea
            properties:
              title: Internal Note
              placeholder: Add a note about this update...
              rows: 4

          - id: update_btn
            type: Button
            properties:
              title: Update Ticket
              type: primary
            events:
              onClick:
                - id: validate_status
                  type: Validate
                - id: update_ticket
                  type: Request
                  params: update_ticket_status
                  messages:
                    success: Ticket updated!
                - id: reload
                  type: Request
                  params: get_ticket

    requests:
      - id: get_ticket
        type: MongoDBFindOne
        connectionId: ticketDb
        properties:
          query:
            _id:
              _input: ticketId

      - id: update_ticket_status
        type: MongoDBUpdateOne
        connectionId: ticketDb
        payload:
          _state: true
        properties:
          filter:
            _id:
              _input: ticketId
          update:
            $set:
              status:
                _payload: new_status
              updated_at:
                _date: now
            $push:
              notes:
                text:
                  _payload: internal_note
                author:
                  _user: name
                timestamp:
                  _date: now
```

---

## The Agent Conversation

An AI agent connected via MCP interacts with this app. Each `→` is an MCP tool call, each `←` is the response.

### 1. Start a Session

```
Agent → session_create({
  name: "Urgent billing tickets",
  description: "Triage and resolve critical billing issues reported today"
})

← {
  sessionId: "sess_t7k92",
  name: "Urgent billing tickets"
}
```

### 2. Navigate to the Ticket List

```
Agent → navigate({ sessionId: "sess_t7k92", pageId: "tickets" })

← {
  page: `
# All Tickets

<container id="filter_card" type="Card">
## Filters

<input id="status_filter" type="ButtonSelector" events=[onChange]>
Status
Options: [all (All), open (Open), in_progress (In Progress), resolved (Resolved)]
Current value: null
</input>

<button id="apply_filter" events=[onClick]>
Apply Filter
</button>

</container>

<display id="tickets_table" type="AgGridAlpine" rows="12">
| Subject | Customer | Priority | Status | Created |
| --- | --- | --- | --- | --- |
| Can't download invoice PDF | alice@acme.com | critical | open | 2024-01-15T09:23:00Z |
| Double charged for subscription | bob@widgets.co | high | open | 2024-01-15T08:45:00Z |
| Need invoice address change | carol@example.org | medium | open | 2024-01-14T16:30:00Z |
| Refund not processed | dave@startup.io | high | in_progress | 2024-01-14T14:12:00Z |
| Tax calculation wrong | eve@corp.com | critical | open | 2024-01-14T11:00:00Z |
| ... (7 more rows) |
</display>
  `,

  log: [
    { action: "onMount", success: true, requestResults: [
      { requestId: "get_tickets", success: true, response: [ /* 12 ticket objects */ ] }
    ]}
  ]
}
```

### 3. Filter to Critical Open Tickets

```
Agent → interact({
  sessionId: "sess_t7k92",
  actions: [
    { type: "setValue", blockId: "status_filter", value: "open" },
    { type: "triggerEvent", blockId: "apply_filter", event: "onClick" }
  ]
})

← {
  page: `
# All Tickets

<container id="filter_card" type="Card">
## Filters

<input id="status_filter" type="ButtonSelector" events=[onChange]>
Status
Options: [all (All), open (Open), in_progress (In Progress), resolved (Resolved)]
Current value: "open"
</input>

<button id="apply_filter" events=[onClick]>
Apply Filter
</button>

</container>

<display id="tickets_table" type="AgGridAlpine" rows="8">
| Subject | Customer | Priority | Status | Created |
| --- | --- | --- | --- | --- |
| Can't download invoice PDF | alice@acme.com | critical | open | 2024-01-15T09:23:00Z |
| Double charged for subscription | bob@widgets.co | high | open | 2024-01-15T08:45:00Z |
| Need invoice address change | carol@example.org | medium | open | 2024-01-14T16:30:00Z |
| Tax calculation wrong | eve@corp.com | critical | open | 2024-01-14T11:00:00Z |
| ... (4 more rows) |
</display>
  `,

  log: [
    { action: "setValue", blockId: "status_filter", success: true },
    { action: "triggerEvent", blockId: "apply_filter", event: "onClick", success: true,
      requestResults: [
        { requestId: "get_tickets", success: true, response: [ /* 8 open tickets */ ] }
      ]
    }
  ]
}
```

### 4. Navigate to the Critical Ticket

```
Agent → navigate({
  sessionId: "sess_t7k92",
  pageId: "ticket_detail",
  input: { ticketId: "65a4f3b2c1d2e3f4a5b6c7d8" }
})

← {
  page: `
# Ticket Detail

<display id="ticket_info" type="Descriptions">
| Label | Value |
| --- | --- |
| Subject | Can't download invoice PDF |
| Customer | alice@acme.com |
| Priority | critical |
| Current Status | open |
</display>

<input id="new_status" type="ButtonSelector" events=[onChange]>
Update Status
Options: [open (Open), in_progress (In Progress), resolved (Resolved), closed (Closed)]
Current value: null
</input>

<input id="internal_note" type="TextArea" events=[onChange]>
Internal Note — Placeholder: "Add a note about this update..."
Current value: null
</input>

<button id="update_btn" events=[onClick]>
Update Ticket
</button>
  `,

  log: [
    { action: "onMount", success: true, requestResults: [
      { requestId: "get_ticket", success: true, response: {
        _id: "65a4f3b2c1d2e3f4a5b6c7d8",
        subject: "Can't download invoice PDF",
        customer_email: "alice@acme.com",
        priority: "critical",
        category: "Billing",
        status: "open",
        description: "When I click download on any invoice from the last 3 months, nothing happens. Chrome console shows 404 error.",
        created_at: "2024-01-15T09:23:00Z"
      }}
    ]}
  ]
}
```

### 5. Update the Ticket Status

```
Agent → interact({
  sessionId: "sess_t7k92",
  actions: [
    { type: "setValue", blockId: "new_status", value: "in_progress" },
    { type: "setValue", blockId: "internal_note", value: "Investigating PDF generation service. Likely related to the S3 bucket migration on Jan 12. Escalating to backend team." },
    { type: "triggerEvent", blockId: "update_btn", event: "onClick" }
  ]
})

← {
  page: `
# Ticket Detail

<display id="ticket_info" type="Descriptions">
| Label | Value |
| --- | --- |
| Subject | Can't download invoice PDF |
| Customer | alice@acme.com |
| Priority | critical |
| Current Status | in_progress |
</display>

<input id="new_status" type="ButtonSelector" events=[onChange]>
Update Status
Options: [open (Open), in_progress (In Progress), resolved (Resolved), closed (Closed)]
Current value: "in_progress"
</input>

<input id="internal_note" type="TextArea" events=[onChange]>
Internal Note — Placeholder: "Add a note about this update..."
Current value: "Investigating PDF generation service. Likely related to the S3 bucket migration on Jan 12. Escalating to backend team."
</input>

<button id="update_btn" events=[onClick]>
Update Ticket
</button>
  `,

  log: [
    { action: "setValue", blockId: "new_status", success: true },
    { action: "setValue", blockId: "internal_note", success: true },
    { action: "triggerEvent", blockId: "update_btn", event: "onClick", success: true,
      requestResults: [
        { requestId: "update_ticket_status", success: true, response: { modifiedCount: 1 } },
        { requestId: "get_ticket", success: true, response: {
          _id: "65a4f3b2c1d2e3f4a5b6c7d8",
          subject: "Can't download invoice PDF",
          status: "in_progress",
          notes: [{
            text: "Investigating PDF generation service. Likely related to the S3 bucket migration on Jan 12. Escalating to backend team.",
            author: "Support Bot",
            timestamp: "2024-01-15T10:15:00Z"
          }]
        }}
      ],
      messages: ["Ticket updated!"]
    }
  ]
}
```

### 6. Create a New Ticket for a Related Issue

```
Agent → navigate({ sessionId: "sess_t7k92", pageId: "new_ticket" })

← {
  page: `
# New Ticket

<container id="form_card" type="Card">
## Create Support Ticket

<input id="customer_email" type="TextInput" required="true" events=[onChange]>
Customer Email — Placeholder: "customer@example.com"
Current value: null
</input>

<input id="priority" type="ButtonSelector" required="true" events=[onChange]>
Priority
Options: [low (Low), medium (Medium), high (High), critical (Critical)]
Current value: null
</input>

<input id="category" type="Selector" required="true" events=[onChange]>
Category
Options: [Billing, Technical, Account, Feature Request]
Current value: null
</input>

<input id="subject" type="TextInput" required="true" events=[onChange]>
Subject — Placeholder: "Brief description of the issue"
Current value: null
</input>

<input id="description" type="TextArea" required="true" events=[onChange]>
Description — Placeholder: "Detailed description..."
Current value: null
</input>

<button id="submit_ticket" events=[onClick]>
Submit Ticket [AiOutlineSend]
</button>

</container>
  `,
  log: []
}
```

```
Agent → interact({
  sessionId: "sess_t7k92",
  actions: [
    { type: "setValue", blockId: "customer_email", value: "frank@acme.com" },
    { type: "setValue", blockId: "priority", value: "high" },
    { type: "setValue", blockId: "category", value: "Billing" },
    { type: "setValue", blockId: "subject", value: "Invoice PDF download broken - affects all Acme Corp users" },
    { type: "setValue", blockId: "description", value: "Multiple users at Acme Corp (alice@acme.com, frank@acme.com) report inability to download invoice PDFs. Issue started around Jan 12. Likely related to S3 migration. This is a duplicate/related issue to ticket 65a4f3b2." },
    { type: "triggerEvent", blockId: "submit_ticket", event: "onClick" }
  ]
})

← {
  page: `
# New Ticket

<container id="form_card" type="Card">
## Create Support Ticket

<input id="customer_email" type="TextInput" required="true" events=[onChange]>
Customer Email — Placeholder: "customer@example.com"
Current value: "frank@acme.com"
</input>

<input id="priority" type="ButtonSelector" required="true" events=[onChange]>
Priority
Options: [low (Low), medium (Medium), high (High), critical (Critical)]
Current value: "high"
</input>

...

</container>
  `,

  log: [
    { action: "setValue", blockId: "customer_email", success: true },
    { action: "setValue", blockId: "priority", success: true },
    { action: "setValue", blockId: "category", success: true },
    { action: "setValue", blockId: "subject", success: true },
    { action: "setValue", blockId: "description", success: true },
    { action: "triggerEvent", blockId: "submit_ticket", event: "onClick", success: true,
      requestResults: [
        { requestId: "insert_ticket", success: true, response: { insertedId: "65a4f8c9d0e1f2a3b4c5d6e7" } },
        { requestId: "send_slack_notification", success: true, response: { status: 200 } }
      ],
      messages: ["Ticket created!"]
    }
  ]
}
```

### 7. Check Global State (lastTicketId was set by SetGlobal)

```
Agent → get_state({ sessionId: "sess_t7k92" })

← {
  pageId: "new_ticket",
  state: {
    customer_email: "frank@acme.com",
    priority: "high",
    category: "Billing",
    subject: "Invoice PDF download broken - affects all Acme Corp users",
    description: "Multiple users at Acme Corp..."
  },
  global: {
    lastTicketId: "65a4f8c9d0e1f2a3b4c5d6e7"
  },
  requests: {
    insert_ticket: [{ response: { insertedId: "65a4f8c9d0e1f2a3b4c5d6e7" }, loading: false }],
    send_slack_notification: [{ response: { status: 200 }, loading: false }]
  }
}
```

### 8. Close Session

```
Agent → session_close({ sessionId: "sess_t7k92" })
← { success: true }
```

### 9. Resume Session Later

```
Agent → session_list()
← [
  {
    sessionId: "sess_t7k92",
    name: "Urgent billing tickets",
    description: "Triage and resolve critical billing issues reported today",
    status: "closed",
    currentPageId: "new_ticket",
    updatedAt: "2024-01-15T10:20:00Z"
  },
  {
    sessionId: "sess_m3p45",
    name: "Weekly report prep",
    description: "Gathering metrics for weekly standup",
    status: "open",
    currentPageId: "admin_dashboard",
    updatedAt: "2024-01-15T09:00:00Z"
  }
]
```

---

## Key Patterns Demonstrated

1. **Cross-page navigation** — agent moves between ticket list, detail, and creation
2. **State persistence** — filter values, form data persist within session
3. **Global state** — `SetGlobal` stores `lastTicketId` accessible across pages
4. **Request chaining** — submit triggers `insert_ticket` then `send_slack_notification`
5. **Input with payload** — `_payload: customer_email` resolves from form state via Engine
6. **Dynamic query** — ticket list uses `_if` operator to build MongoDB query from filter state
7. **Page input** — ticket detail receives `ticketId` via `_input` on navigation
8. **onMount lifecycle** — ticket list and detail auto-fetch data when navigated to
9. **Validation** — `Validate` action runs before request, blocks submit if required fields empty
10. **Session resume** — agent can list and resume sessions across conversations
