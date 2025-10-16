export class User {
    #id;
    email;
    #auth_user;
    created_at;

    #profile;
    username;
    first_name;
    middle_name;
    last_name;
    full_name;
    avatar_bucket;
    object_path;
    avatar_url;
    #wallet_balance;

    stats;

    current_listings;
    total_reviews;
    total_stars;
    avg_rating;

    items_sold;
    items_bought;

    constructor(authUser, profile, item, review) {
        const fullNameArr = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean);
        // From Auth Database
        this.#id = authUser.id;
        this.email = authUser.email;
        this.#auth_user = authUser;
        this.created_at = authUser.created_at;

        this.#profile = profile;
        this.username = profile.username;
        this.first_name = profile.first_name;
        this.middle_name = profile.middle_name;
        this.last_name = profile.last_name;
        this.full_name = fullNameArr.length > 0 ? fullNameArr.join(' ') : profile.username
        this.avatar_bucket = profile.avatar_bucket || 'avatar';
        this.object_path = profile.object_path;
        this.wallet_balance = profile.wallet_balance.toFixed(2);
        this.wallet_held = profile.wallet_held.toFixed(2);

        this.total_reviews = review?.total ?? 0,
        this.total_stars = review?.total_stars ?? 0,
        this.avg_rating = this.total_reviews > 0 ? Number(review.avg_rating).toFixed(1) : '0.0',

        this.stats = [
            {title: 'Listing', number: item??0},
            {title: 'Sold', number: item??0},
            {title: 'Bought', number: item??0},
        ];

        // this.current_listings = item ?? 0;

        // this.total_reviews = review?.total ?? 0;
        // this.total_stars = review?.total_stars ?? 0;
        // this.avg_rating = this.total_reviews > 0 ? Number(review.avg_rating).toFixed(1) : '0.0';
        // this.items_sold = item ?? 0;
        // this.items_bought = item ?? 0;
    }

    get id() {
        return this.#id;
    }

    get authUser() {
        return this.#auth_user;
    }

    set authUser(auth_user) {
        this.#auth_user = auth_user
    }

    get profile() {
        return this.#profile;
    }

    set profile(profile) {
        this.#profile = profile;
    }

    set avatar_url(avatar_url) {
        this.avatar_url = avatar_url;
    }

    // get id() {
    //     return this.#authUser?.id;
    // }

    // get email() {
    //     return this.#authUser?.email;
    // }

    // get username() {
    //     return this.#profile?.username || 'Unknown User';
    // }

    // get firstName() {
    //     return this.#profile?.first_name;
    // }

    // get middleName() {
    //     return this.#profile?.middle_name;
    // }

    // get lastName() {
    //     return this.#profile?.last_name;
    // }

    // get fullName() {
    //     const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
    //     return parts.length > 0 ? parts.join(' ') : this.username;
    // }

    // get avatarBucket() {
    //     return this.#profile?.avatar_bucket || 'avatar';
    // }

    // get avatarPath() {
    //     return this.#profile?.object_path;
    // }

    // get createdAt() {
    //     return this.#authUser?.created_at;
    // }

    getTimeAgo() {
        if (!this.created_at) return 'Recently';
        const now = new Date();
        const past = new Date(this.created_at);
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
