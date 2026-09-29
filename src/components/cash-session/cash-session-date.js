const CASH_SESSION_TIME_ZONE = 'Asia/Jakarta';

const cashSessionDateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: CASH_SESSION_TIME_ZONE
});

export const formatCashSessionDate = value => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return `${ cashSessionDateFormatter.format(date) } WIB`;
};
