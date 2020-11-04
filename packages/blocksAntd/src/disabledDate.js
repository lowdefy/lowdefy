import moment from 'moment';
import { type } from '@lowdefy/helpers';

const disabledDate = (disabledDates = {}) => {
  const min = type.isNone(disabledDates.min)
    ? undefined
    : moment(disabledDates.min).utc().startOf('day');
  const max = type.isNone(disabledDates.max)
    ? undefined
    : moment(disabledDates.max).utc().endOf('day');
  const dates = (disabledDates.dates || []).map((date) => moment(date).utc().startOf('day'));
  const ranges = (disabledDates.ranges || [])
    .map((range) => {
      if (type.isArray(range) && range.length === 2) {
        return [moment(range[0]).utc().startOf('day'), moment(range[1]).utc().endOf('day')];
      }
      return null;
    })
    .filter((range) => range !== null);

  return (currentDate) => {
    const utcCurrentData = currentDate.utc();
    if (min && utcCurrentData.isBefore(min)) return true;
    if (max && utcCurrentData.isAfter(max)) return true;
    let match = dates.find((date) => date.isSame(utcCurrentData.startOf('day')));
    if (match) return true;
    ranges.forEach((range) => {
      if (
        utcCurrentData.startOf('day').isSameOrAfter(range[0]) &&
        utcCurrentData.endOf('day').isSameOrBefore(range[1])
      ) {
        match = true;
      }
    });
    if (match) return true;
    return false;
  };
};

export default disabledDate;
