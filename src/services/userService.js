import 'server-only'

import { getProfileById, getProfileByUsername, insertProfile } from '@/repositories/profileRepo'
import { verifyEmailExists } from '@/repositories/userRepo';

export async function userExists(email) {
	if (!email) throw new Error("Email is required");
	try {
		return verifyEmailExists(email);
	} catch (e){
		throw new Error(e.message);
	};
};

export async function usernameExists(username) {
    if (!username) throw new Error("Username is required");
    try {
        const existing = await getProfileByUsername(username);
        return !!existing;
    } catch (e) {
        throw new Error(e.message);
    }
};
