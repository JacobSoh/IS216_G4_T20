// import { User } from '@/models/user';
import 'server-only';
import {
    re
} from '@/repositories/userRepo';

export async function register(email, password, metadata) {
    const data = await re(email, password, metadata);
    if (!data) throw new Error('Register process failed');
    return data;
};