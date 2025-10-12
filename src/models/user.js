export class User {
    #authUser;
    #profile;

    constructor(authUser, profile) {
        this.#authUser = authUser;
        this.#profile = profile;
    }

    get id() {
        return this.#authUser?.id;
    }

    get email() {
        return this.#authUser?.email;
    }

    get authUser() {
        return this.#authUser;
    }

    get profile() {
        return this.#profile;
    }

    get username() {
        return this.#profile?.username || 'Unknown User';
    }

    get firstName() {
        return this.#profile?.first_name;
    }

    get middleName() {
        return this.#profile?.middle_name;
    }

    get lastName() {
        return this.#profile?.last_name;
    }

    get fullName() {
        const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : this.username;
    }

    get avatarBucket() {
        return this.#profile?.avatar_bucket || 'avatar';
    }

    get avatarPath() {
        return this.#profile?.object_path;
    }

    get createdAt() {
        return this.#authUser?.created_at;
    }

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
}
