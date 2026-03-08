// Fix models with empty string last_names
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixEmptyLastNames() {
  // Get all models with empty last_name
  const { data: models } = await supabase
    .from('models')
    .select('id, first_name, last_name');

  const needsFix = models.filter(m => !m.last_name || m.last_name.trim() === '');

  console.log(`Found ${needsFix.length} models with empty last_name\n`);

  let fixed = 0;

  for (const model of needsFix) {
    // Assume first_name contains full name, split it
    const parts = model.first_name.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    if (!lastName) {
      // Single name person - use first name for both or add placeholder
      console.log(`⚠️  ${model.first_name} - single name, skipping`);
      continue;
    }

    const { error } = await supabase
      .from('models')
      .update({ 
        first_name: firstName,
        last_name: lastName 
      })
      .eq('id', model.id);

    if (!error) {
      console.log(`✓ Fixed: "${model.first_name}" → "${firstName}" + "${lastName}"`);
      fixed++;
    } else {
      console.log(`✗ Error fixing ${model.id}:`, error.message);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`✓ Fixed: ${fixed}`);
  console.log(`⊘ Skipped (single name): ${needsFix.length - fixed}`);
}

fixEmptyLastNames().catch(console.error);
