// Import pro climbers from CSV
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importProClimbers() {
  // Read the CSV file (you'll need to provide the path)
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-proclimbers.js <csv-file-path>');
    process.exit(1);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading CSV from ${csvPath}...`);
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  let records = [];
  try {
    records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    console.error('CSV parse error:', err.message);
    process.exit(1);
  }

  console.log(`Found ${records.length} records in CSV`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const name = (record.NAME || '').trim();
      if (!name) {
        console.log('⊘ Skipped: Empty name');
        skipped++;
        continue;
      }

      const nameParts = name.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if already exists
      const { data: existing, error: checkError } = await supabase
        .from('models')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      if (existing) {
        console.log(`⊘ Skipped: ${name} (already exists)`);
        skipped++;
        continue;
      }

      // Clean Instagram handle
      const igRaw = (record.INSTAGRAM || '').trim();
      const instagram = igRaw.replace(/^@+\s*/, '');

      // Insert new model
      const { data: newModel, error: insertError } = await supabase
        .from('models')
        .insert({
          first_name: firstName,
          last_name: lastName,
          instagram_handle: instagram || null,
          notes: record.NOTES || null,
          reviewed: true,
          source: 'pro_climbers_import',
          // Tag with climbing type (you can add this to a new field if needed)
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`✗ Error importing ${name}:`, insertError.message);
        errors++;
        continue;
      }

      console.log(`✓ Imported: ${name} (@${instagram || 'no-ig'})`);
      imported++;

    } catch (err) {
      console.error(`✗ Exception for ${record.NAME}:`, err.message);
      errors++;
    }
  }

  console.log(`\n=== IMPORT SUMMARY ===`);
  console.log(`✓ Imported: ${imported}`);
  console.log(`⊘ Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`Total processed: ${imported + skipped + errors}`);
}

importProClimbers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
