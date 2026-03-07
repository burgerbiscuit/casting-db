const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const { data: climbers, count } = await supabase
      .from('models')
      .select('id, first_name, last_name, reviewed, skills, source', { count: 'exact' })
      .eq('source', 'climbers-tender-moments');

    console.log(`\n✅ CLIMBER MODELS STATUS\n`);
    console.log(`Total climber models: ${count}`);
    
    const pending = climbers?.filter(c => !c.reviewed).length || 0;
    const approved = climbers?.filter(c => c.reviewed).length || 0;
    
    console.log(`  Pending review (reviewed=false): ${pending}`);
    console.log(`  Approved (reviewed=true): ${approved}`);

    // Check if they have Climbing skill
    const withClimbing = climbers?.filter(c => c.skills?.includes('Climbing')).length || 0;
    console.log(`  With 'Climbing' skill: ${withClimbing}`);

    if (pending === 79 && withClimbing === 79) {
      console.log(`\n✅ ALL SET! All 79 climbers are:`);
      console.log(`  ✓ In pending review`);
      console.log(`  ✓ Have 'Climbing' skill`);
      console.log(`  ✓ Ready to appear on admin/models page`);
    } else {
      console.log(`\n⚠️ Need to fix:`);
      if (pending < 79) {
        console.log(`  - Set ${79 - pending} to reviewed=false`);
      }
      if (withClimbing < 79) {
        console.log(`  - Add 'Climbing' skill to ${79 - withClimbing}`);
      }
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
