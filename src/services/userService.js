import 'server-only'

import { getProfileById, getProfileByUsername, insertProfile } from '@/repositories/profileRepo'
import { signUpUser } from '@/repositories/userRepo'

const DEFAULT_AVATAR_PATH = 'avatar/default.png'

export async function register({
  email,
  password,
  username,
  profile = {},
  metadata = {}
}) {
  if (!email || !password || !username) {
    throw new Error('Email, password, and username are required')
  }

  const existingProfile = await getProfileByUsername(username)
  if (existingProfile) {
    throw new Error('Username is already taken')
  }

  let authData
  try {
    const userMetadata = {
      username,
      avatar_bucket: profile.avatar_bucket ?? 'avatar',
      object_path: profile.object_path ?? DEFAULT_AVATAR_PATH,
      ...metadata
    }
    authData = await signUpUser({
      email,
      password,
      options: {
        data: userMetadata
      }
    })
  } catch (error) {
    console.error('[userService.register] signUpUser failed', error)
    if (error?.message?.toLowerCase().includes('user already registered')) {
      throw new Error('Email is already registered')
    }
    throw error
  }

  const user = authData?.user
  if (!user) {
    throw new Error('Register process failed')
  }

  const existingAuthProfile = await getProfileById(user.id)
  if (existingAuthProfile) {
    return {
      user,
      profile: existingAuthProfile
    }
  }

  const profilePayload = {
    id: user.id,
    username,
    first_name: profile.first_name ?? null,
    middle_name: profile.middle_name ?? null,
    last_name: profile.last_name ?? null,
    street: profile.street ?? null,
    city: profile.city ?? null,
    state: profile.state ?? null,
    zip: profile.zip ?? null,
    avatar_bucket: profile.avatar_bucket ?? 'avatar',
    object_path: profile.object_path ?? DEFAULT_AVATAR_PATH
  }

  let profileRecord
  try {
    profileRecord = await insertProfile(profilePayload)
  } catch (error) {
    console.error('[userService.register] insertProfile failed', error, profilePayload)
    throw error
  }

  return {
    user,
    profile: profileRecord
  }
}
