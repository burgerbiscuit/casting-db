const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixInstagramHandles() {
  console.log('Fetching all models with Instagram handles...');
  const { data: models, error } = await supabase
    .from('models')
    .select('id, instagram_handle')
    .not('instagram_handle', 'is', null);

  if (error) {
    console.error('Error fetching models:', error);
    process.exit(1);
  }

  console.log(`Found ${models.length} models with Instagram handles`);

  let fixCount = 0;
  for (const model of models) {
    // Remove leading @ symbols and trim whitespace
    const cleanHandle = model.instagram_handle.replace(/^@+\s*/, '').trim();
    
    if (cleanHandle !== model.instagram_handle) {
      console.log(`Fixing: "${model.instagram_handle}" → "${cleanHandle}"`);
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

  console.log(`\nFixed ${fixCount} Instagram handles`);
}

fixInstagramHandles();
