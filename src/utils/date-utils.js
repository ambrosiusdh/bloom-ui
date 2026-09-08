import { format, parseISO } from 'date-fns';
import { id } from "date-fns/locale";

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateInput(value) {
    if (!DATE_INPUT_PATTERN.test(value || '')) return false;

    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    return parsed.getUTCFullYear() === year
        && parsed.getUTCMonth() === month - 1
        && parsed.getUTCDate() === day;
}

/**
 * Formats a Java Instant (ISO 8601 string) to a human-readable format.
 * @param {string} isoString - The ISO date string to format.
 * @param {string} formatString - The format to apply. Default: 'EEEE, dd-MM-yyyy HH:mm'
 * @returns {string} Formatted date string.
 */
function formatDate(isoString, formatString = 'EEEE, dd-MM-yyyy HH:mm') {
    if (!isoString) return '';

    try {
        return format(parseISO(isoString), formatString, { locale: id });
    } catch {
        return isoString;
    }
}

export {
    formatDate,
    isValidDateInput
}
