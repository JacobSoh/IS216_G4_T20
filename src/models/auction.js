import 'server-only';

export class Auction {
    #aid;
    #oid;
    name;
    start_time;
    end_time;
    description;
    thumbnail;
    
    constructor(data) {
        this.#aid = data.aid,
        this.#oid = data.oid;
        this.name = data.name,
        this.start_time = new Date(data.start_time);
        this.end_time = new Date(data.end_time);
        this.description = data.description;
        this.thumbnail = data.thumbnail;
    };

    getAID() {
        return this.#aid;
    };

    getOwnerID() {
        return this.#oid;
    };

    setAID(aid) {
        this.#aid = aid;
    };

    setOwnerID(oid) {
        this.#oid = oid;
    };

    getTimeLeft() {
        // Calculate the difference in milliseconds
        const milliDiff = this.end_time.getTime() - this.start_time.getTime();

        // Convert milliseconds to seconds, minutes, and hours
        const totalSeconds = Math.floor(milliDiff / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);

        // Calculate remaining seconds and minutes for a hh:mm:ss format
        const remSeconds = totalSeconds % 60;
        const remMinutes = totalMinutes % 60;
        return {
            ms: milliDiff,
            s: totalSeconds,
            m: totalMinutes,
            rS: remSeconds,
            rM: remMinutes,
            h: totalHours
        };
    };

    getJson() {
        return {
            'aid': this.#aid,
            'name': this.name,
            'oid': this.#oid,
            'start_time': this.start_time,
            'end_time': this.end_time,
            'description': this.description,
            'thumbnail': this.thumbnail
        };
    };
};