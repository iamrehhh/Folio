import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    // Ensure bucket exists
    const { data: buckets } = await adminClient.storage.listBuckets();
    if (!buckets?.find((b) => b.name === 'avatars')) {
      await adminClient.storage.createBucket('avatars', { public: true });
    }

    // Upload using admin client to bypass RLS policies on new bucket
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = adminClient.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Update profile using admin client to bypass profile RLS if restrictive
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatar_url: publicUrl });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
