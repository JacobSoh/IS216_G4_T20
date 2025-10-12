import { User } from "@/models/user";
import { axiosBrowserClient } from "@/utils/axios/client";
import { supabaseBrowser } from "@/utils/supabase/client";

export default async function getUser() {
    const sb = supabaseBrowser();

    try {
        const { data: { user } } = await sb.auth.getUser();

        if (!user) {
            throw new Error("User does not exist");
        }

        const response = await axiosBrowserClient.get(`/api/profile/${user.id}`);

        // Axios client has interceptor that unwraps response.data
        // So response is already {status: 200, record: {...}}
        const profileData = response.record;

        if (!profileData) {
            console.error('[getUserData] Invalid response:', response);
            throw new Error("User profile unable to retrieve");
        }

        return new User(user, profileData);

    } catch (e) {
        console.error('[getUserData] Error:', e);
        throw e;
    }
}
