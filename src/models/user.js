export class User {
    #oid;
    constructor(data = {}) {
        this.#oid = data.oid;
        this.created_at = data.created_at;
    };

    getTimeAgo(dateString) {
        if (!dateString) return 'Recently';
            const now = new Date();
            const past = new Date(dateString);
            const diffMs = now - past;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffMonths = Math.floor(diffDays / 30);
            const diffYears = Math.floor(diffDays / 365);

            if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
            if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
            if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return 'Today';
    }
};