// setupDayjs.ts
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from "dayjs/plugin/duration";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import relativeTime from "dayjs/plugin/relativeTime";


dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(relativeTime);

export default dayjs;
