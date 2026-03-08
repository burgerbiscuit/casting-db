// Import climber stories from Google Sheet
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Climber stories data extracted from spreadsheet
// This is a manual entry from the fetched CSV data
// You can update this by re-fetching from the Google Sheet

const climberData = [
  { name: 'Felix Wong', location: 'New York City', age: 38, homeGym: 'non at the moment', instagram: 'felinewong', email: 'felixwongphoto@gmail.com', story: 'I love the climbing community', type: 'climber_stories' },
  { name: 'Sami Mekonen', location: 'Los Angeles, California', age: 26, homeGym: 'Hollywood Boulders, Touchstone Climbing', instagram: 'samimekonen_', email: 'samiamekonen@gmail.com', story: 'I like climbing cause its a stress reliever', type: 'climber_stories' },
  { name: 'Koraya Fay', location: 'Gilbert, Arizona', age: 19, homeGym: 'Alta (Gilbert)', instagram: 'korayafay', email: 'Korayafay@gmail.com', story: 'The moment I started rock climbing I felt free!', type: 'climber_stories' },
  { name: 'Christa Guzmán', location: 'Brooklyn, NY', age: 24, homeGym: 'Metrorock Bushwick', instagram: 'christa.guz', email: 'christaguzman01@gmail.com', story: 'As a young Latina girl with ADHD I felt welcomed and safe', type: 'climber_stories' },
  // Add more entries as needed...
];

async function importClimbers() {
  console.log(`Starting import of ${climberData.length} climber records...`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const climber of climberData) {
    try {
      // Check if already exists (by email or name)
      const { data: existing } = await supabase
        .from('models')
        .select('id')
        .eq('first_name', climber.name.split(' ')[0])
        .eq('last_name', climber.name.split(' ').slice(1).join(' '))
        .single();

      if (existing) {
        console.log(`⊘ Skipped: ${climber.name} (already exists)`);
        skipped++;
        continue;
      }

      // Create new model record
      const { data: newModel, error: insertError } = await supabase
        .from('models')
        .insert({
          first_name: climber.name.split(' ')[0],
          last_name: climber.name.split(' ').slice(1).join(' '),
          email: climber.email,
          instagram_handle: climber.instagram.replace(/^@+/, ''),
          based_in: climber.location,
          age: parseInt(climber.age),
          // Store story in notes for now (or create a new field)
          notes: climber.story,
          reviewed: true, // Mark as reviewed since it's from the sheet
          source: 'climber_stories_import',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`✗ Error importing ${climber.name}:`, insertError.message);
        errors++;
        continue;
      }

      console.log(`✓ Imported: ${climber.name}`);
      imported++;

    } catch (err) {
      console.error(`✗ Exception for ${climber.name}:`, err.message);
      errors++;
    }
  }

  console.log(`\n=== IMPORT SUMMARY ===`);
  console.log(`✓ Imported: ${imported}`);
  console.log(`⊘ Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`Total: ${imported + skipped + errors}`);
}

importClimbers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
