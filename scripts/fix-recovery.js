const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n🔧 FIXING RECOVERY...\n`);

    // Get submissions from 3/7 (the 29 from today that should stay pending)
    const start307 = new Date('2026-03-07').toISOString();

    // Set submissions from 3/7 back to pending (they were pending from the start)
    // But keep 3/1-3/6 as is since we want those pending too
    
    // Actually - EVERYONE should be pending except what you explicitly approved
    // Since we don't have a good record of what was approved vs not,
    // let's reset 3/1-3/6 to all pending
    // and keep 3/7 as is (new submissions)

    const { data: before307 } = await supabase
      .from('models')
      .select('id')
      .eq('source', 'scouting')
      .lt('created_at', start307);

    const { data: after307 } = await supabase
      .from('models')
      .select('id')
      .eq('source', 'scouting')
      .gte('created_at', start307);

    console.log(`Submissions from 3/1-3/6: ${before307?.length || 0}`);
    console.log(`Submissions from 3/7 (today): ${after307?.length || 0}`);

    // Set all 3/1-3/6 to pending=false (not reviewed)
    if (before307 && before307.length > 0) {
      const beforeIds = before307.map(m => m.id);

      await supabase
        .from('models')
        .update({ reviewed: false })
        .in('id', beforeIds);

      console.log(`\n✅ Set ${beforeIds.length} submissions from 3/1-3/6 to PENDING`);
    }

    // Keep 3/7 submissions pending (leave as is)
    if (after307 && after307.length > 0) {
      console.log(`✅ Left ${after307.length} submissions from 3/7 as PENDING`);
    }

    // Verify
    const { count: finalPending } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'scouting')
      .eq('reviewed', false);

    console.log(`\n📊 FINAL STATUS:`);
    console.log(`  ⏳ Total pending: ${finalPending}\n`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
