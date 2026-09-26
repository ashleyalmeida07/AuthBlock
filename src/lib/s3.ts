import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

const supabase = createClient(supabaseUrl, supabaseKey)

// The old AWS S3 bucket name was used, we'll use 'authblock' or from env
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'authblock'

/**
 * Uploads a file buffer to Supabase Storage and returns its public URL.
 * Keeps the name `uploadToS3` for backward compatibility.
 * @param key      Object key, e.g. "certificates/ABC-2025-1234.pdf"
 * @param body     File content as Uint8Array / Buffer
 * @param contentType  MIME type, e.g. "application/pdf"
 */
export async function uploadToS3(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string
): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .upload(key, body, {
      contentType: contentType,
      upsert: true
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error(`Failed to upload to Supabase: ${error.message}`)
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from(bucketName)
    .getPublicUrl(key)

  return publicUrl
}
