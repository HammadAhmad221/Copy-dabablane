import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Import locales if needed
import 'dayjs/locale/fr';

// Extend dayjs with plugins
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

// Set default locale to French
dayjs.locale('fr');

export default dayjs; 