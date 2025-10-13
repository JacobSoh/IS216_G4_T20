import 'server-only'

import { 
    getProfileById
} from '@/repositories/profileRepo'

const DEFAULT_AVATAR_PATH = 'avatar/default.png'

export async function retrieveProfileById(id) {
    try {
        const profile = await getProfileById(id);
        return profile;
    } catch (e) {
        throw error;
    };

}

export async function updateProfileByID(data) {
    const { username } = data;

    if (!username) {
        throw new Error('Username is required');
    };

    const existingProfile = await getProfileByUsername(username)
    if (existingProfile) {
        throw new Error('Username is already taken')
    };

    try {
        const result = await updateProfileById(data);
        return result;
    } catch (e) {
        throw error
    };

    // let authData
    // try {
    //     const userMetadata = {
    //         username,
    //         avatar_bucket: profile.avatar_bucket ?? 'avatar',
    //         object_path: profile.object_path ?? DEFAULT_AVATAR_PATH,
    //         ...metadata
    //     }
    //     authData = await re({
    //         email,
    //         password,
    //         options: {
    //             data: userMetadata
    //         }
    //     })
    // } catch (error) {
    //     console.error('[userService.register] register failed', error)
    //     if (error?.message?.toLowerCase().includes('user already registered')) {
    //         throw new Error('Email is already registered')
    //     }
    //     throw error
    // }

    // const user = authData?.user
    // if (!user) {
    //     throw new Error('Register process failed')
    // }

    // const existingAuthProfile = await getProfileById(user.id)
    // if (existingAuthProfile) {
    //     return {
    //         user,
    //         profile: existingAuthProfile
    //     }
    // }

    // const profilePayload = {
    //     id: user.id,
    //     username,
    //     first_name: profile.first_name ?? null,
    //     middle_name: profile.middle_name ?? null,
    //     last_name: profile.last_name ?? null,
    //     street: profile.street ?? null,
    //     city: profile.city ?? null,
    //     state: profile.state ?? null,
    //     zip: profile.zip ?? null,
    //     avatar_bucket: profile.avatar_bucket ?? 'avatar',
    //     object_path: profile.object_path ?? DEFAULT_AVATAR_PATH
    // }

    // let profileRecord
    // try {
    //     profileRecord = await insertProfile(profilePayload)
    // } catch (error) {
    //     console.error('[userService.register] insertProfile failed', error, profilePayload)
    //     throw error
    // }

    // return {
    //     user,
    //     profile: profileRecord
    // }
}
