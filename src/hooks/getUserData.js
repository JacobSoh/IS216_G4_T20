import { User } from "@/models/user";
import { axiosBrowserClient } from "@/utils/axios/client";
import { supabaseBrowser } from "@/utils/supabase/client";

export default async function getUser() {
    const sb = supabaseBrowser();
    try {
        
        const { data: {user} } = await sb.auth.getUser();
        if (!user) {
            throw new Error("User does not exists");
        };

        const info = await axiosBrowserClient.get(`/api/profile/${user.id}`);
        if (info.status !== 200 || !info.record) {
            throw new Error("User profile unable to retrieve");
        };

        const info = await axiosBrowserClient.get(`/api/profile/${user.id}`);
        if (info.status !== 200 || !info.record) {
            throw new Error("User profile unable to retrieve");
        };

        return new User(user, info.record);
    } catch (e) {
        throw new Error("User does not exists");
    }
};