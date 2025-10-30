import 'server-only'
import { getProfileById, getProfileByUsername, updateProfileById } from '@/repositories/profileRepo';
import { retrieveItemsByAuctionOIDandTime } from '@/repositories/itemRepo';
import { retrieveReviewStats } from '@/repositories/reviewRepo';
import { getAvatarPublicUrl } from '@/repositories/bucketRepo';
import { User } from '@/models/user';

const DEFAULT_AVATAR_PATH = 'avatar/default.png'

export async function retrieveProfileById(id, avatarUrl, objectPath) {
    try {
        const nowIso = new Date().toISOString();

        const profile = await getProfileById(id);
        const item = await retrieveItemsByAuctionOIDandTime(id,nowIso);
        const review = await retrieveReviewStats(id);
        const avatar_url = await getAvatarPublicUrl(avatarUrl, objectPath);
        return {profile, item, review, avatar_url};
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
