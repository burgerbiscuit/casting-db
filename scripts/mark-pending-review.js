// Mark pro climbers and imported climber stories as pending review (reviewed: false)
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function markPending() {
  console.log('Marking pro climbers and imported climber stories as pending review...\n');

  // Mark pro climbers as pending
  const { data: proClimbers, error: proError } = await supabase
    .from('models')
    .select('id, first_name, last_name')
    .eq('source', 'pro_climbers_import')
    .eq('reviewed', true);

  if (proError) {
    console.error('Error fetching pro climbers:', proError);
    process.exit(1);
  }

  console.log(`Found ${proClimbers.length} pro climbers to mark as pending...`);
  
  if (proClimbers.length > 0) {
    const { error: updateError } = await supabase
      .from('models')
      .update({ reviewed: false })
      .eq('source', 'pro_climbers_import');

    if (updateError) {
      console.error('Error updating pro climbers:', updateError);
    } else {
      console.log(`✓ Marked ${proClimbers.length} pro climbers as pending review`);
    }
  }

  // Mark climber stories as pending
  const { data: climberStories, error: climberError } = await supabase
    .from('models')
    .select('id, first_name, last_name')
    .eq('source', 'climber_stories_import')
    .eq('reviewed', true);

  if (climberError) {
    console.error('Error fetching climber stories:', climberError);
    process.exit(1);
  }

  console.log(`Found ${climberStories.length} climber stories to mark as pending...`);

  if (climberStories.length > 0) {
    const { error: updateError } = await supabase
      .from('models')
      .update({ reviewed: false })
      .eq('source', 'climber_stories_import');

    if (updateError) {
      console.error('Error updating climber stories:', updateError);
    } else {
      console.log(`✓ Marked ${climberStories.length} climber stories as pending review`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Pro climbers pending: ${proClimbers.length}`);
  console.log(`Climber stories pending: ${climberStories.length}`);
  console.log(`Total pending: ${proClimbers.length + climberStories.length}`);
}

markPending().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
