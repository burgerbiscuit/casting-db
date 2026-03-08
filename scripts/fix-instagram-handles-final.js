// Final cleanup: remove trailing slashes and query parameters from Instagram handles
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalCleanup() {
  console.log('Fetching all models with Instagram handles...');
  const { data: models, error } = await supabase
    .from('models')
    .select('id, instagram_handle')
    .not('instagram_handle', 'is', null);

  if (error) {
    console.error('Error fetching models:', error);
    process.exit(1);
  }

  console.log(`Found ${models.length} models with Instagram handles\n`);

  let fixCount = 0;

  for (const model of models) {
    let cleanHandle = model.instagram_handle.trim();

    // Remove trailing slashes
    while (cleanHandle.endsWith('/')) {
      cleanHandle = cleanHandle.slice(0, -1);
    }

    // Remove query parameters (igsh=..., utm_source=..., etc.)
    if (cleanHandle.includes('?')) {
      cleanHandle = cleanHandle.split('?')[0];
    }

    // Remove any remaining whitespace
    cleanHandle = cleanHandle.trim();

    if (cleanHandle !== model.instagram_handle) {
      console.log(`Cleaning: "${model.instagram_handle}" → "${cleanHandle}"`);

      const { error: updateError } = await supabase
        .from('models')
        .update({ instagram_handle: cleanHandle })
        .eq('id', model.id);

      if (updateError) {
        console.error(`Error updating ${model.id}:`, updateError);
      } else {
        fixCount++;
      }
    }
  }

  console.log(`\n=== FINAL CLEANUP SUMMARY ===`);
  console.log(`Fixed ${fixCount} handles (removed slashes & params)`);
}

finalCleanup().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
