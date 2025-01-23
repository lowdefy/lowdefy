# Working with Forms in Lowdefy

## Pt. 3: Date and Time

Textboxes and checkboxes are the fundamental requirements in web form design.

An extremely common requirement in web form design is date and time management.
A user may need to provide a range or an instant, with their selection being as broad as a month or as precise as a minute.

Lowdefy provides a number of input blocks optimised for date and time input.

> Examples:
>
> - `DateSelector`
> - `DateTimeSelector`
> - `DateRangeSelector`
> - `MonthSelector`
> - `WeekSelector`

These blocks make both input and management much more intuitive.

## DateSelector

Selecting a specific date is a common requirement in web forms.
When a user needs to input their birth date or request leave from work, this is the type of field they would use.

Lowdefy's implementation opens up a calendar when the field is clicked, allowing the user to select the relevant date.

1. The calendar opens in the current month, with the current date clearly highlighted
2. The user may click on arrows to move forward or backward through months, one at a time
3. Clicking the year or month opens a selector for quick access to more distant dates
4. Dates and date ranges can be disabled if required (e.g, past or future dates, weekends or holidays)

### DateTimeSelector

In many cases, such as booking a plane or arranging a meeting, the user will need to select a particular time as well.

Lowdefy's `DateTimeSelector` adds a time section next to the calendar.
This section is divided into columns for hours, minutes, and seconds.

The section below contains examples of both the standard `DateSelector` and the more specific `DateTimeSelector`.

```yaml ldf
_ref: pages/blog/categories/forms/date-time/DateAndTimeSelectors.yaml
```

The date and time formats can also be configured, meaning the date can be presented as 28/12/24 or 2024-12-28, for example.

```yaml ldf
_ref: pages/blog/categories/forms/date-time/DateFormat.yaml
```

This also means that the minute and second columns can be omitted, removing them from both display and selection.

## DateRangeSelector

Naturally, the `DateRangeSelector` allows the user to select start and end dates.

```yaml ldf
_ref: pages/blog/categories/forms/date-time/DateRangeSelector.yaml
```

Lowdefy's implementation of this field opens 2 calendars simultaneously, with carefully designed UI and UX.
After selecting the start date, the selector autofocuses on the second calendar.
Hovering over a date adds a dotted outline around extended ranges, and contrasting highlighting when reducing the selected range.

## MonthSelector and WeekSelector

Some situations necessitate selection of month or week, rather than a specific date.
Perhaps you offer weekly or monthly courses, where regular date selection is not entirely applicable.

For these relatively rare instances, Lowdefy includes the `MonthSelector` and `WeekSelector` blocks.

## Properties

As with all Lowdefy blocks, Date input blocks can be deeply customised to meet more specific use-case requirements.

To illustrate this, we can compare the default implementation of `DateTimeSelector` against one with custom properties.

```yaml ldf
_ref: pages/blog/categories/forms/date-time/FilterCompare.yaml
```

By default, the minute options increment in steps of 5, while the second block has been configured for 15-minute increments.

### Disabled Dates

In many cases, users should be prevented from selecting certain dates and date ranges.

Each Lowdefy Date block has a property to set these dates as required.

```yaml ldf
_ref: pages/blog/categories/forms/date-time/DisabledDates.yaml
```

The block above has been configured to prevent the user from selecting the first week of February.

> Note:  
> Date values are set to UTC by default, meaning the timezone must be set as required.
> To ensure the local timezone is used,

## Learn More

Lowdefy aims to cover every use case possible, with readily available blocks that are easy to work with - both for the developer and the user.

Names for these blocks and their properties were selected to make configuration simple and intuitive, and the UI was designed to be clean and understandable.

The next topic we'll discuss is dropdown selection in Lowdefy Forms.

Start your own Lowdefy project to try out `CheckboxSelector`, `CheckboxSwitch`, and `RadioSelector` blocks.

```bash
pnpx lowdefy@4 init && pnpx lowdefy@4 dev
 # note: requires node v18 (or newer) and pnpm
```

Don't forget to look through our [docs](https://docs.lowdefy.com/DateSelector) for more details on features and implementation.
