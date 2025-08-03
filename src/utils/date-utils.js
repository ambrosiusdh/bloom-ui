import { format, parseISO } from 'date-fns';
import { id } from "date-fns/locale";

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
    formatDate
}