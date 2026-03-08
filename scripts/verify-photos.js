// Verify photos haven't been deleted or hidden
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyPhotos() {
  console.log('Checking for any hidden or missing photos...\n');

  // Check specific models
  const testModels = ['Cristina Piccone', 'Tasha Tongpreecha', 'Kjnara Swanson'];
  
  for (const fullName of testModels) {
    const parts = fullName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    const { data: model } = await supabase
      .from('models')
      .select('id, first_name, last_name')
      .eq('first_name', firstName)
      .eq('last_name', lastName)
      .single();

    if (!model) {
      console.log(`❌ ${fullName} — not found in database`);
      continue;
    }

    const { data: photos } = await supabase
      .from('model_media')
      .select('id, is_visible, storage_path, public_url')
      .eq('model_id', model.id);

    if (!photos || photos.length === 0) {
      console.log(`⚠️  ${fullName} — NO PHOTOS in database`);
      continue;
    }

    const visible = photos.filter(p => p.is_visible).length;
    const hidden = photos.filter(p => !p.is_visible).length;

    console.log(`✓ ${fullName}:`);
    console.log(`  Total photos: ${photos.length}`);
    console.log(`  Visible: ${visible}`);
    console.log(`  Hidden: ${hidden}`);

    if (hidden > 0) {
      console.log(`  ⚠️  WARNING: ${hidden} photos are hidden (is_visible=false)`);
      console.log(`  To fix: UPDATE model_media SET is_visible=true WHERE model_id='${model.id}' AND is_visible=false`);
    }
    console.log();
  }

  // Check global stats
  console.log('\n=== GLOBAL PHOTO STATS ===');
  const { data: allPhotos } = await supabase
    .from('model_media')
    .select('is_visible', { count: 'exact' });

  const totalPhotos = allPhotos ? allPhotos.length : 0;
  const visiblePhotos = allPhotos ? allPhotos.filter(p => p.is_visible).length : 0;
  const hiddenPhotos = totalPhotos - visiblePhotos;

  console.log(`Total photos in DB: ${totalPhotos}`);
  console.log(`Visible: ${visiblePhotos}`);
  console.log(`Hidden: ${hiddenPhotos}`);

  if (hiddenPhotos > 50) {
    console.log(`\n⚠️  WARNING: ${hiddenPhotos} photos are hidden!`);
    console.log('To unhide all: UPDATE model_media SET is_visible=true WHERE is_visible=false');
  }
}

verifyPhotos().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
