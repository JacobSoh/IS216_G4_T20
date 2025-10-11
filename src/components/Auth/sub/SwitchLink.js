'use client';

import { useModal } from "@/context/ModalContext";
import {
    Login,
    Register
} from '@/components/LR/index';

export default function SwitchLink( { isLogin } ) {

    const { openModal  } = useModal();
    return (
        <p className='mt-4 text-center text-sm/6 text-gray-400'>
            {isLogin?'Not a member':'Already have an account'}?&nbsp;
            <button
                type="button"
                className="font-semibold text-indigo-400 hover:text-indigo-300"
                onClick={() => {
                    openModal({
                        content: isLogin?<Register />:<Login />,
                        title: 'BidHub'
                    });
                }}
            >
                {isLogin?'Join us now':'Login'}!
            </button>
            {/* <a href={isLogin?'/register':'/login'} className='font-semibold text-indigo-400 hover:text-indigo-300'>{isLogin?'Join us now!':'Login!'}</a> */}
        </p>
    );
};