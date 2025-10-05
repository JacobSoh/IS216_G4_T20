'use client';
export default function SwitchLink( { isLogin } ) {
    return (
        <p className='mt-4 text-center text-sm/6 text-gray-400'>
            {isLogin?'Not a member?':'Already have an account'}?&nbsp;
            <a href={isLogin?'/register':'/login'} className='font-semibold text-indigo-400 hover:text-indigo-300'>{isLogin?'Join us now!':'Login!'}</a>
        </p>
    );
};