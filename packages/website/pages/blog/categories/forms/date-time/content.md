# Working with Forms in Lowdefy

## Pt. 4: Date and Time

Textboxes and checkboxes are the fundamental requirements in web form design.

Just as important is date and time management, although this can be more complex to implement.

You may need a range or an instant, and you may need more or less specificity.

Lowdefy makes working with date and time much more intuitive, with a set of input blocks optimised for every situation.

## DateSelector

Selecting a specific date is a common requirement in web forms.
When a user needs to input their birth date or request leave from work, this is the type of field they would use.

Lowdefy's implementation opens up a calendar when the field is clicked, allowing the user to select the relevant date.

This calendar has every feature you would want from a date picker, and usage is very natural:

1. The calendar opens in the current month, with the current date clearly highlighted
2. The user may click on arrows to move forward or backward through months, one at a time
3. Clicking the year or month opens a selector for quick access to more distant dates
4. Dates and date ranges can be disabled if required (e.g, past or future dates, weekends or holidays)

### DateTimeSelector

In many cases, such as booking a plane or arranging a meeting, the user will need to select a particular time as well.

Lowdefy's DateTimeSelector adds a time section next to the calendar.
This section is divided into columns for hours, minutes, and seconds.
The intervals for each column can be set so as not to prevent unnecessary options - users generally don't need to book a plane ticket for 16:32, for example.

The date and time formats can also be configured, meaning the date can be presented as 28/12/24 or 2024-12-28, for example.
This also means that the minute and second columns can be omitted, removing them from both display and selection.

### MonthSelector and WeekSelector

Some situations necessitate selection of month or week, rather than a specific date.
Perhaps you offer weekly or monthly courses, where regular date selection is not entirely applicable.

For these relatively rare instances, Lowdefy includes the MonthSelector and WeekSelector blocks.

## DateRangeSelector

Naturally, the DateRangeSelector allows the user to select start and end dates.

Lowdefy's implementation of this field opens 2 calendars simultaneously, with carefully designed UI and UX.
After selecting the start date, the selector autofocuses on the second calendar.
Hovering over a date adds a dotted outline around extended ranges, and contrasting highlighting when reducing the selected range.

{{ insert gif }}

## Learn More

Lowdefy aims to cover every use case possible, with readily available blocks that are easy to work with - both for the developer and the user.

Names for these blocks and their properties were selected to make configuration simple and intuitive, and the UI was designed to be clean and understandable.

The next topic we'll discuss is dropdown selection in Lowdefy Forms.

Start your own Lowdefy project to try out CheckboxSelector, CheckboxSwitch, and RadioSelector blocks.

```bash
pnpx lowdefy@4 init && pnpx lowdefy@4 dev
 # note: requires node v18 (or newer) and pnpm
```

Don't forget to look through our [docs](https://docs.lowdefy.com/DateSelector) for more details on features and implementation.
