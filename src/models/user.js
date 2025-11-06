export class User {
    #id;
    email;
    #auth_user;
    created_at;

    #profile;
    #verified;
    username;
    first_name;
    middle_name;
    last_name;
    full_name;
    avatar_bucket;
    object_path;
    #avatarUrl;
    #wallet_balance;

    stats;

    current_listings;
    total_reviews;
    total_stars;
    avg_rating;

    items_sold;
    items_bought;

    constructor(authUser, profile, statsData, review) {
        const fullNameArr = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean);
        // From Auth Database
        this.#id = authUser.id;
        this.email = authUser.email;
        this.#auth_user = authUser;
        this.created_at = authUser.created_at;
        this.#verified = profile.verified;

        this.#profile = profile;
        this.username = profile.username;
        this.first_name = profile.first_name;
        this.middle_name = profile.middle_name;
        this.last_name = profile.last_name;
        this.full_name = fullNameArr.length > 0 ? fullNameArr.join(' ') : profile.username
        this.avatar_bucket = profile.avatar_bucket || 'avatar';
        this.object_path = profile.object_path;
        this.#avatarUrl = profile.avatar_url || null;
        this.wallet_balance = profile.wallet_balance.toFixed(2);
        this.wallet_held = profile.wallet_held.toFixed(2);
        this.address = profile.address || '';

        this.total_reviews = review?.total ?? 0,
        this.total_stars = review?.total_stars ?? 0,
        this.avg_rating = this.total_reviews > 0 ? Number(review.avg_rating).toFixed(1) : 'No ratings yet',

        this.stats = [
            { title: 'Sold', number: statsData?.itemsSold ?? 0 },
            { title: 'Won', number: statsData?.itemsWon ?? 0 }
        ];
    }

    get verified() {
        return this.#verified;
    };

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

    get avatar_url() {
        return this.#avatarUrl;
    }

    set avatar_url(avatar_url) {
        this.#avatarUrl = avatar_url;
    }
}
