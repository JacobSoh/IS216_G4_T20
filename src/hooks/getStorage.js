import { supabaseBrowser } from "@/utils/supabase/client";

export async function getAvatarPublicUrl(user) {
  const sb = supabaseBrowser();
  const { data, error } = await sb.storage
    .from(user.avatar_bucket)
    .getPublicUrl(user.object_path??'');
  if (error) new Error(error.message);
  user.avatar_url = data.publicUrl;
  return data;
};

