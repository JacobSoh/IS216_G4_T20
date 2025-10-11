'use client';

import { Dialog, DialogPanel, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

export default function Modal({ isOpen, onClose, title, titleClassName, children }) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className='flex min-h-full items-center justify-center p-4'>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="relative w-full max-w-md rounded-lg bg-gray-800 shadow-xl">
                                <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 p-4">
                                    {title && (
                                        <Dialog.Title className={titleClassName ?? "text-base font-semibold text-gray-100"}>
                                            {title}
                                        </Dialog.Title>
                                    )}
                                    <div className="ml-auto">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-md p-2 text-gray-400 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                                            aria-label="Close modal"
                                        >
                                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </div>

                                </div>
                                {children}
                            </DialogPanel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition >
    );
}
