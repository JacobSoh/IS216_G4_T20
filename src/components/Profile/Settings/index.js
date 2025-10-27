'use client';

import { useEffect, useState } from 'react';
import { usernameRe } from '@/lib/validators';
import { FieldGroup } from '@/components/ui/field';
import { CustomInput, CustomAddressInput } from '@/components/Form';

export default function Settings({ profile }) {

  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarBucket, setAvatarBucket] = useState('avatar');
  const [avatarPath, setAvatarPath] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [addrDisplay, setAddrDisplay] = useState('');

  useEffect(() => {
    setInitialUsername(profile?.username || '');
    setAvatarPath(profile?.object_path || null);
    // Only use local preview for newly selected files; do not seed with avatar_url
    setAvatarPreview('');
    setAvatarBucket(profile?.avatar_bucket || 'avatar');
    setInitialLoading(false);
  }, [profile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please select a valid image file');
    if (file.size > 5 * 1024 * 1024) return setError('Image size should be less than 5MB');
    setError(null);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Address selection no longer populates structured fields; using only display string

  if (initialLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-gray-600 bg-gray-700">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : profile?.object_path ? (
              <img src={profile?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition">
            <label className="cursor-pointer">
              <input
                type="file"
                name="avatar"
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

      {/* Fields */}
      <FieldGroup>
        <CustomInput
          type="username"
          defaultValue={profile?.username}
          regex={usernameRe}
          regexMessage="Name must be valid!"
        />
        <CustomInput type="firstname" defaultValue={profile?.first_name} required={true} />
        <CustomInput type="middlename" defaultValue={profile?.middle_name} />
        <CustomInput type="lastname" defaultValue={profile?.last_name} required={true} />
        <CustomAddressInput name="address" defaultValue={profile?.address} />
      </FieldGroup>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-md">{error}</div>
      )}
    </div>
  );
}
