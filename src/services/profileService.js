import 'server-only'
import { getProfileById, getProfileByUsername, updateProfileById } from '@/repositories/profileRepo'

const DEFAULT_AVATAR_PATH = 'avatar/default.png'

export async function retrieveProfileById(id) {
    try {
        const profile = await getProfileById(id)
        return profile
    } catch (e) {
        console.error('[profileService] retrieveProfileById error:', e)
        throw e
    }
}

export async function updateProfile(userId, data) {
    const { username } = data

    if (!username) {
        throw new Error('Username is required')
    }

    const existingProfile = await getProfileByUsername(username)
    if (existingProfile && existingProfile.id !== userId) {
        throw new Error('Username is already taken')
    }

    try {
        const result = await updateProfileById(userId, data)
        return result
    } catch (e) {
        console.error('[profileService] updateProfile error:', e)
        throw e
    }
}
