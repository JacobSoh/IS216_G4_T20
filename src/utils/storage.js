export function buildStoragePublicUrl({
  bucket,
  objectPath,
  baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
} = {}) {
  if (!bucket || !objectPath || !baseUrl) {
    return null
  }
  const trimmedBase = baseUrl.replace(/\/+$/, '')
  const trimmedPath = objectPath.replace(/^\/+/, '')
  return `${trimmedBase}/storage/v1/object/public/${bucket}/${trimmedPath}`
}
