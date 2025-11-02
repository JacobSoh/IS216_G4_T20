export default function getTimeAgo({ datetime } = {}) {
    if (!datetime) return 'Just now';

    const now = new Date();
    const past = new Date(datetime);
    const diffMs = now - past;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const monthsNow = now.getFullYear() * 12 + now.getMonth();
    const monthsPast = past.getFullYear() * 12 + past.getMonth();
    const diffMonths = Math.abs(monthsNow - monthsPast);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears} day${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} day${diffMonths > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}