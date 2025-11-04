import 'server-only'
import { getProfileByUsername, updateProfileById } from '@/repositories/profileRepo';

export async function updateProfileByID(data) {
    const { userId, username } = data

    if (!username) {
        throw new Error('Username is required')
    }

    if (!userId) {
        throw new Error('User ID is required')
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
