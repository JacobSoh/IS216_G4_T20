'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { CustomInput } from '@/components/Form';
import { usernameRe } from '@/lib/validators';
import { useModal } from '@/context/ModalContext';
import { toast } from 'sonner';

export default function Settings() {
  const supabase = supabaseBrowser();
  const { setModalForm, setModalState } = useModal();

  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [avatarBucket, setAvatarBucket] = useState('avatar');
  const [avatarPath, setAvatarPath] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [initialUsername, setInitialUsername] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) throw new Error('Not authenticated');

        setUserId(authUser.id);

        const { data: profileData, error: profileError } = await supabase
          .from('profile')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (profileError) throw new Error('Failed to load profile');

        setInitialUsername(profileData.username || '');

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

  useEffect(() => {
    // Wire modal form submission to use FormData, similar to ToggleLR
    setModalForm({
      isForm: true,
      onSubmit: async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);

        try {
          if (!userId) throw new Error('User not loaded');

          const username = f.get('username')?.toString().trim() || '';
          const avatarFile = f.get('avatar');

          let newAvatarPath = avatarPath;

          // Upload avatar if a new file is chosen
          if (avatarFile && avatarFile.size > 0) {
            if (!avatarFile.type?.startsWith('image/')) throw new Error('Please select a valid image file');
            if (avatarFile.size > 5 * 1024 * 1024) throw new Error('Image size should be less than 5MB');

            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;

            if (avatarPath) {
              await supabase.storage.from(avatarBucket).remove([avatarPath]);
            }

            const { error: uploadError } = await supabase.storage
              .from(avatarBucket)
              .upload(fileName, avatarFile, { cacheControl: '3600', upsert: false });
            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            newAvatarPath = fileName;
          }

          const { error: updateError } = await supabase
            .from('profile')
            .update({
              username,
              object_path: newAvatarPath,
            })
            .eq('id', userId);
          if (updateError) throw new Error(`Update failed: ${updateError.message}`);

          toast.success('Profile updated');
          setModalState({ open: false });
          setTimeout(() => window.location.reload(), 350);
        } catch (err) {
          toast.error(err?.message || 'Failed to update profile');
        }
      },
    });
  }, [setModalForm, setModalState, supabase, userId, avatarBucket, avatarPath]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Please select a valid image file');
    if (file.size > 5 * 1024 * 1024) return setError('Image size should be less than 5MB');
    setError(null);
    setAvatarPreview(URL.createObjectURL(file));
  };

  if (initialLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-gray-600 bg-gray-700">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                {initialUsername?.[0]?.toUpperCase() || 'U'}
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
      <div className="space-y-4">
        <CustomInput
          type="username"
          defaultValue={initialUsername}
          regex={usernameRe}
          regexMessage="Name must be valid!"
        />
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-md">{error}</div>
      )}
    </div>
  );
}
