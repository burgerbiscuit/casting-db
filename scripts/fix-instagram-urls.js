// Fix Instagram handles that are stored as URLs instead of just handles
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixInstagramUrls() {
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
  let examples = [];

  for (const model of models) {
    let cleanHandle = model.instagram_handle;

    // Fix various URL formats
    if (cleanHandle.includes('instagram.com/')) {
      cleanHandle = cleanHandle.split('instagram.com/')[1];
      console.log(`Fixing: "${model.instagram_handle}" → "${cleanHandle}"`);
      
      if (examples.length < 5) {
        examples.push({ before: model.instagram_handle, after: cleanHandle });
      }

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

  console.log(`\n=== FIX SUMMARY ===`);
  console.log(`Fixed ${fixCount} Instagram URL handles`);
  if (examples.length > 0) {
    console.log('\nExamples:');
    examples.forEach(ex => {
      console.log(`  ${ex.before} → ${ex.after}`);
    });
  }
}

fixInstagramUrls().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
