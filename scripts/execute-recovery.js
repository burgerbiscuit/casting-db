const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n⏳ RECOVERING PENDING SUBMISSIONS...\n`);

    const before307 = new Date('2026-03-07').toISOString();

    // Set all reviewed scout submissions from before 3/7 back to pending
    const { error } = await supabase
      .from('models')
      .update({ reviewed: false })
      .eq('source', 'scouting')
      .eq('reviewed', true)
      .lt('created_at', before307);

    if (error) {
      console.error('❌ RECOVERY FAILED:', error);
      return;
    }

    console.log(`✅ RECOVERY COMPLETE!\n`);

    // Verify
    const { count: newPending } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'scouting')
      .eq('reviewed', false);

    const { count: newApproved } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'scouting')
      .eq('reviewed', true);

    console.log(`📊 NEW STATUS:\n`);
    console.log(`  ⏳ Pending review: ${newPending}`);
    console.log(`  ✅ Already approved: ${newApproved}`);
    console.log(`\nYour pending review section should now show ~197 submissions\n`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
