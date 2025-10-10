// components/GlobalAlert.jsx
'use client';
import { useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { useAlert } from '@/context/AlertContext';
import AlertBanner from '@/components/sub/alert/banner';

export default function GlobalAlert() {
	const { alert, hideAlert } = useAlert();
	const [rendered, setRendered] = useState(null); // { message, variant }
	const show = !!alert;

	// When a new alert arrives, cache it for the leave animation later.
	useEffect(() => {
		if (alert) setRendered(alert);
	}, [alert]);

	if (!rendered) return null;

	return (
		<div className="fixed left-0 right-0 top-20 z-50 mx-auto max-w-lg">
			<Transition
				show={show}
				appear
				enter="transform transition ease-out duration-300"
				enterFrom="opacity-0 -translate-y-3"
				enterTo="opacity-100 translate-y-0"
				leave="transform transition ease-in duration-200"
				leaveFrom="opacity-100 translate-y-0"
				leaveTo="opacity-0 -translate-y-3"
				afterLeave={() => setRendered(null)} // finally unmount cached alert
			>
				<div>
					<AlertBanner
						variant={rendered.variant}
						onClose={hideAlert} // triggers leave; content stays until afterLeave
					>
						{rendered.message}
					</AlertBanner>
				</div>
			</Transition>
		</div>
	);
}
