'use client';

import { useState } from 'react';
import { Button } from '@headlessui/react';
import {
	Header,
	InputControl,
	SwitchLink,
} from '@/components/authForm';
import Spinner from '@/components/SpinnerComponent';
import { useAuthForm } from '@/hooks/useAuthForm';

export default function AuthFormComponent({
	showLoading,
	error,
	onSubmit,
	isLogin = true,
}) {
	// whether to validate "empties" (you asked to do it on hover/focus)
	const [validateOnHover, setValidateOnHover] = useState(false);

	const {
		form,
		handleField,
		errors: { emailErr, passwordErr, usernameErr, matchErr },
		getHasErrors,
	} = useAuthForm(isLogin);

	const hasErrors = getHasErrors(validateOnHover);

	return (
		<div className="max-w-lg mx-auto px-6 lg:px-8">
			<div className="flex flex-col justify-center py-5">
				<h2 className='text-center text-2xl/9 font-bold tracking-tight text-white'>{isLogin?'Login to your account!':'Register your account today!'}{/*Register your account today!*/}</h2>
				<div className="mt-4 mx-auto w-full">
					<form onSubmit={onSubmit} className="space-y-6">
						<InputControl
							labelText="Email"
							formName="email"
							type="email"
							isRequired
							placeholder="example_email@example.com"
							value={form.email}
							onChange={handleField('email')}
							inputErr={emailErr}
							isLogin={isLogin}
						/>

						<InputControl
							labelText="Password"
							formName="password"
							type="password"
							isRequired
							placeholder="Enter your password"
							value={form.password}
							onChange={handleField('password')}
							inputErr={passwordErr}
							isLogin={isLogin}
						/>

						{!isLogin && (
							<>
								<InputControl
									labelText="Confirm Password"
									formName="confirm_password"
									type="password"
									isRequired
									placeholder="Re-enter your password"
									value={form.confirm_password}
									onChange={handleField('confirm_password')}
									inputErr={matchErr}
								/>

								<InputControl
									labelText="Username"
									formName="username"
									type="text"
									isRequired
									placeholder="Enter your username"
									value={form.username}
									onChange={handleField('username')}
									inputErr={usernameErr}
								/>
							</>
						)}

						<Button
							type="submit"
							onMouseEnter={() => setValidateOnHover(true)}
							onFocus={() => setValidateOnHover(true)}    // keyboard users
							onMouseLeave={() => setValidateOnHover(false)}
							onBlur={() => setValidateOnHover(false)}
							className="mt-5 w-full rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white 
                         hover:bg-indigo-400 focus-visible:outline-2
                         focus-visible:outline-offset-2 focus-visible:outline-indigo-500
                         disabled:bg-indigo-200 disabled:text-gray-400"
							disabled={hasErrors}
						>
							<div className="flex items-center justify-center gap-2">
								{isLogin ? 'Login' : 'Register'}
								{showLoading && <Spinner />}
							</div>
						</Button>
					</form>

					<SwitchLink isLogin={isLogin} />
				</div>
			</div>
		</div>
	);
};