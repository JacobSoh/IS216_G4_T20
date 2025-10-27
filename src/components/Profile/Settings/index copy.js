'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useSettingsForm } from '@/hooks/useSettingsForm';
import { FieldGroup } from '@/components/ui/field';
import { CustomInput } from '@/components/Form';
// import { InputControl } from '../../sub';
import { emailRe, usernameRe, passwordRe } from '@/lib/validators'; 

export default function Settings({ onClose }) {
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [userId, setUserId] = useState(null);
    const [avatarBucket, setAvatarBucket] = useState('avatar');
    const [avatarPath, setAvatarPath] = useState(null);
    const supabase = supabaseBrowser();

    const {
        form,
        handleField,
        handleReset,
        dispatch,
        errors: { usernameErr },
    } = useSettingsForm();

    // Load user data on mount
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Get authenticated user
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

                if (authError || !authUser) {
                    throw new Error('Not authenticated');
                }

                setUserId(authUser.id);

                // Get profile data directly from Supabase
                const { data: profileData, error: profileError } = await supabase
                    .from('profile')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profileError) {
                    throw new Error('Failed to load profile');
                }

                console.log('Profile Data:', profileData); // Debug log

                // Pre-fill all form fields
                dispatch({ type: "FIELD", field: "username", value: profileData.username || '' });
                dispatch({ type: "FIELD", field: "firstName", value: profileData.first_name || '' });
                dispatch({ type: "FIELD", field: "middleName", value: profileData.middle_name || '' });
                dispatch({ type: "FIELD", field: "lastName", value: profileData.last_name || '' });
                dispatch({ type: "FIELD", field: "street", value: profileData.street || '' });
                dispatch({ type: "FIELD", field: "city", value: profileData.city || '' });
                dispatch({ type: "FIELD", field: "state", value: profileData.state || '' });
                dispatch({ type: "FIELD", field: "zip", value: profileData.zip || '' });

                // Load avatar if exists
                if (profileData.object_path) {
                    setAvatarPath(profileData.object_path);
                    setAvatarBucket(profileData.avatar_bucket || 'avatar');
                    const { data } = supabase.storage
                        .from(profileData.avatar_bucket || 'avatar')
                        .getPublicUrl(profileData.object_path);
                    setAvatarPreview(data.publicUrl);
                }
            } catch (err) {
                console.error('Failed to load user data:', err);
                setError('Failed to load user data');
            } finally {
                setInitialLoading(false);
            }
        };

        loadUserData();
    }, [supabase]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            if (!userId) {
                throw new Error('User not loaded');
            }

            let newAvatarPath = avatarPath;

            // Upload new avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${userId}-${Date.now()}.${fileExt}`;

                // Delete old avatar if exists
                if (avatarPath) {
                    await supabase.storage
                        .from(avatarBucket)
                        .remove([avatarPath]);
                }

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(avatarBucket)
                    .upload(fileName, avatarFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }

                newAvatarPath = fileName;
            }

            // Update profile in database
            const { error: updateError } = await supabase
                .from('profile')
                .update({
                    first_name: form.firstName,
                    middle_name: form.middleName,
                    last_name: form.lastName,
                    street: form.street,
                    city: form.city,
                    state: form.state,
                    zip: form.zip,
                    username: form.username,
                    object_path: newAvatarPath
                })
                .eq('id', userId);

            if (updateError) {
                console.error('Update error:', updateError);
                throw new Error(`Update failed: ${updateError.message}`);
            }

            setSuccess(true);
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = () => {
        handleReset();
    };

    if (initialLoading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <>
            {/* Body - Scrollable */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {/* Avatar Upload - Centered */}
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative w-32 h-32 flex-shrink-0">
                        <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-gray-600 bg-gray-700">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                                    {form.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </label>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">Avatar Preview</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    {/* Username - Full Width */}
                    <CustomInput 
                        type="username"
                        regex={usernameRe}
                        regexMessage='Name must be valid!'
                    />
                    {/* <InputControl
                        labelText="Username"
                        formName="username"
                        type="text"
                        isRequired
                        placeholder="Your Username"
                        value={form.username}
                        onChange={handleField('username')}
                        inputErr={usernameErr}
                    /> */}

                    {/* Name Fields - Grid */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputControl
                            labelText="First Name"
                            formName="firstName"
                            type="text"
                            isRequired
                            placeholder="Your First Name"
                            value={form.firstName}
                            onChange={handleField('firstName')}
                        />
                        <InputControl
                            labelText="Middle Name"
                            formName="middleName"
                            type="text"
                            isRequired
                            placeholder="Your Middle Name"
                            value={form.middleName}
                            onChange={handleField('middleName')}
                        />
                        <InputControl
                            labelText="Last Name"
                            formName="lastName"
                            type="text"
                            isRequired
                            placeholder="Your Last Name"
                            value={form.lastName}
                            onChange={handleField('lastName')}
                        />
                    </div> */}

                    {/* Street Address - Full Width */}
                    {/* <InputControl
                        labelText="Street Address"
                        formName="street"
                        type="text"
                        isRequired
                        placeholder="Your Street Address"
                        value={form.street}
                        onChange={handleField('street')}
                    /> */}

                    {/* City, State, ZIP - Grid */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputControl
                            labelText="City"
                            formName="city"
                            type="text"
                            isRequired
                            placeholder="Your City"
                            value={form.city}
                            onChange={handleField('city')}
                        />
                        <InputControl
                            labelText="State"
                            formName="state"
                            type="text"
                            isRequired
                            placeholder="Your State"
                            value={form.state}
                            onChange={handleField('state')}
                        />
                        <InputControl
                            labelText="ZIP"
                            formName="zip"
                            type="text"
                            isRequired
                            placeholder="Your ZIP Code"
                            value={form.zip}
                            onChange={handleField('zip')}
                        />
                    </div> */}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded-md">
                        Profile updated successfully! Reloading...
                    </div>
                )}
            </div>

            {/* Footer - Fixed */}
            <div className="bg-gray-800 border-t border-gray-700 p-6 flex flex-col sm:flex-row gap-3 rounded-b-2xl">
                <button
                    onClick={handleDiscard}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-md font-semibold hover:bg-gray-600 transition disabled:opacity-50"
                >
                    Discard
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-500 transition disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </>
    );
}
