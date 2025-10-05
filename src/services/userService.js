// import { User } from '@/models/user';
import 'server-only';
import {
    re
} from '@/repositories/userRepo';

export async function register(email, password, options) {
    const data = await re(email, password, options);
    if (!data) throw new Error('Register process failed');
    return data;
};