// Trim all whitespace from first_name and last_name
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function trimNames() {
  console.log('Fetching all models...');
  const { data: models, error } = await supabase
    .from('models')
    .select('id, first_name, last_name');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Found ${models.length} models\n`);

  let trimmed = 0;

  for (const model of models) {
    const newFirst = model.first_name?.trim() || null;
    const newLast = model.last_name?.trim() || null;

    const needsTrim = model.first_name !== newFirst || model.last_name !== newLast;

    if (needsTrim) {
      const { error: updateError } = await supabase
        .from('models')
        .update({ first_name: newFirst, last_name: newLast })
        .eq('id', model.id);

      if (updateError) {
        console.error(`Error updating ${model.id}:`, updateError);
      } else {
        console.log(`✓ Trimmed: "${model.first_name}" → "${newFirst}", "${model.last_name}" → "${newLast}"`);
        trimmed++;
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Trimmed ${trimmed} names`);
}

trimNames().catch(console.error);
