'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useSettingsForm } from '@/hooks/useSettingsForm';
import {
    InputControl
} from '../sub';
import { axiosBrowserClient } from '@/utils/axios/client';

export default function Settings({ onSubmit, closeModal }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const supabase = supabaseBrowser();

    // const handleField =
    //     (field) =>
    //         (e) =>
    //             dispatch({ type: "FIELD", field, value: e.target.value });

    // useEffect(() => {
    //     if (isOpen && currentData) {
    //         setFormData({
    //             firstName: currentData.first_name || '',
    //             middleName: currentData.middle_name || '',
    //             lastName: currentData.last_name || '',
    //             street: currentData.street || '',
    //             city: currentData.city || '',
    //             state: currentData.state || '',
    //             zip: currentData.zip || '',
    //             username: currentData.username || '',
    //         });
    //         if (currentData.object_path) {
    //             setAvatarPreview(`https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/avatar/${currentData.object_path}`);
    //         };
    //     }
    // }, [isOpen, currentData]);

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

    // const handleSave = async () => {
    //     setLoading(true);
    //     setError(null);
    //     setSuccess(false);

    //     try {
    //         let objectPath = currentData?.object_path;

    //         // Upload new avatar if selected
    //         if (avatarFile) {
    //             const fileExt = avatarFile.name.split('.').pop();
    //             const fileName = `${userId}-${Date.now()}.${fileExt}`;

    //             // Delete old avatar if exists
    //             if (currentData?.object_path) {
    //                 await supabase.storage
    //                     .from('avatar')
    //                     .remove([currentData.object_path]);
    //             }

    //             const { data: uploadData, error: uploadError } = await supabase.storage
    //                 .from('avatar')
    //                 .upload(fileName, avatarFile, {
    //                     cacheControl: '3600',
    //                     upsert: false
    //                 });

    //             if (uploadError) {
    //                 console.error('Upload error:', uploadError);
    //                 throw new Error(`Upload failed: ${uploadError.message}`);
    //             }

    //             objectPath = fileName;
    //         }

    //         // Update profile in database
    //         const { error: updateError } = await supabase
    //             .from('profile')
    //             .update({
    //                 first_name: formData.firstName,
    //                 middle_name: formData.middleName,
    //                 last_name: formData.lastName,
    //                 street: formData.street,
    //                 city: formData.city,
    //                 state: formData.state,
    //                 zip: formData.zip,
    //                 username: formData.username,
    //                 object_path: objectPath
    //             })
    //             .eq('id', userId);

    //         if (updateError) {
    //             console.error('Update error:', updateError);
    //             throw new Error(`Update failed: ${updateError.message}`);
    //         }

    //         setSuccess(true);
    //         setTimeout(() => {
    //             onClose();
    //             window.location.reload();
    //         }, 1500);
    //     } catch (err) {
    //         setError(err.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const handleDiscard = () => {
    //     setFormData({
    //         firstName: currentData?.first_name || '',
    //         middleName: currentData?.middle_name || '',
    //         lastName: currentData?.last_name || '',
    //         street: currentData?.street || '',
    //         city: currentData?.city || '',
    //         state: currentData?.state || '',
    //         zip: currentData?.zip || '',
    //         username: currentData?.username || '',
    //     });
    //     setAvatarFile(null);
    //     if (currentData?.object_path) {
    //         setAvatarPreview(`https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/avatar/${currentData.object_path}`);
    //     } else {
    //         setAvatarPreview('');
    //     }
    //     setError(null);
    //     setSuccess(false);
    //     onClose();
    // };

    // if (!isOpen) return null;

    const {
        form,
        handleField,
        handleReset,
        errors: { emailErr, passwordErr, usernameErr, matchErr },
        getHasErrors,
    } = useSettingsForm();

    return (
        <>
            {/* Body - Scrollable */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {/* Avatar Upload - Fixed positioning */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                        <img
                            src={avatarPreview || '/default-avatar.jpg'}
                            alt="Avatar Preview"
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-600"
                        />
                    </div>
                    <label className="cursor-pointer bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                        Change Avatar
                    </label>
                </div>

                {/* Form Fields */}
                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputControl
                            labelText="Username"
                            formName="username"
                            type="text"
                            isRequired
                            placeholder="Your Username"
                            value={form.username}
                            onChange={handleField('username')}
                            inputErr={emailErr}
                        />
                        <InputControl
                            labelText="First Name"
                            formName="firstName"
                            type="text"
                            isRequired
                            placeholder="Your First Name"
                            value={form.firstName}
                            onChange={handleField('firstName')}
                        // inputErr={emailErr}
                        />
                        <InputControl
                            labelText="Middle Name"
                            formName="middleName"
                            type="text"
                            isRequired
                            placeholder="Your Middle Name"
                            value={form.middleName}
                            onChange={handleField('middleName')}
                        // inputErr={emailErr}
                        />
                        <InputControl
                            labelText="Last Name"
                            formName="lastName"
                            type="text"
                            isRequired
                            placeholder="Your Last Name"
                            value={form.lastName}
                            onChange={handleField('lastName')}
                        // inputErr={emailErr}
                        />
                    </div>
                    <InputControl
                        labelText="Street Address"
                        formName="street"
                        type="text"
                        isRequired
                        placeholder="Your Street Address"
                        value={form.street}
                        onChange={handleField('street')}
                    // inputErr={emailErr}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputControl
                            labelText="Street Address"
                            formName="city"
                            type="text"
                            isRequired
                            placeholder="Your City"
                            value={form.city}
                            onChange={handleField('city')}
                        // inputErr={emailErr}
                        />
                        <InputControl
                            labelText="State"
                            formName="street"
                            type="text"
                            isRequired
                            placeholder="Your State"
                            value={form.state}
                            onChange={handleField('state')}
                        // inputErr={emailErr}
                        />
                        <InputControl
                            labelText="ZIP Code"
                            formName="zip"
                            type="text"
                            isRequired
                            placeholder="Your ZIP Code"
                            value={form.zip}
                            onChange={handleField('zip')}
                        // inputErr={emailErr}
                        />
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                        Profile updated successfully!
                    </div>
                )}
            </div>

            {/* Footer - Fixed */}
            <div className="bg-gray-800 border-t border-gray-700 p-6 flex flex-col sm:flex-row gap-3 rounded-b-2xl">
                <button
                    onClick={() => {
                        handleReset();
                        closeModal();
                    }}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition disabled:opacity-50"
                >
                    Discard
                </button>
                <button
                    // onClick={() => {handleSave}}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </>
    );  
}
