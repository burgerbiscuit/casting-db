const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  // Find Callum
  const { data: model } = await supabase
    .from('models')
    .select('id, first_name, last_name')
    .eq('first_name', 'Callum')
    .eq('last_name', 'Stoddart')
    .single();

  if (!model) {
    console.log('Callum not found');
    process.exit(1);
  }

  console.log(`Found: ${model.first_name} ${model.last_name} (ID: ${model.id})\n`);

  // Check all media
  const { data: allMedia } = await supabase
    .from('model_media')
    .select('*')
    .eq('model_id', model.id);

  console.log(`Total media: ${allMedia?.length || 0}`);
  allMedia?.forEach((m, i) => {
    console.log(`  [${i}] Type: ${m.type}, Visible: ${m.is_visible}, PDF Primary: ${m.is_pdf_primary}, Order: ${m.display_order}`);
  });

  // Simulate the query from models page
  console.log('\nSimulating grid query (like models page)...');
  const { data: gridMedia } = await supabase
    .from('model_media')
    .select('model_id, public_url, is_pdf_primary')
    .eq('model_id', model.id)
    .eq('is_visible', true)
    .order('is_pdf_primary', { ascending: false })
    .order('display_order');

  console.log(`Grid query returned: ${gridMedia?.length || 0} items`);
  gridMedia?.forEach((m, i) => {
    console.log(`  [${i}] URL: ${m.public_url?.slice(0, 50)}...`);
  });
}

check().catch(console.error);
