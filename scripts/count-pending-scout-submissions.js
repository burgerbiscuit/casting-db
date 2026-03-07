const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n📋 SCOUT SUBMISSION STATUS\n`);

    // Pending scout submissions
    const { count: pendingScout, data: pending } = await supabase
      .from('models')
      .select('id, first_name, last_name, created_at', { count: 'exact' })
      .eq('source', 'scouting')
      .eq('reviewed', false)
      .order('created_at', { ascending: false });

    console.log(`⏳ PENDING REVIEW (not yet reviewed): ${pendingScout}`);
    if (pending && pending.length > 0) {
      console.log(`\nFirst 10:\n`);
      pending.slice(0, 10).forEach((m, i) => {
        const date = new Date(m.created_at).toLocaleDateString();
        console.log(`  ${i + 1}. ${m.first_name} ${m.last_name} (${date})`);
      });
    }

    // Approved scout submissions
    const { count: approvedScout } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'scouting')
      .eq('reviewed', true);

    console.log(`\n✅ ALREADY REVIEWED (approved): ${approvedScout}`);

    // Total scout submissions
    const { count: totalScout } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'scouting');

    console.log(`\n📊 TOTAL SCOUT SUBMISSIONS: ${totalScout}`);

    console.log(`\n⚠️  MISSING SCOUT SUBMISSIONS:`);
    console.log(`How many unreviewed scout submissions should there be?`);
    console.log(`Currently showing: ${pendingScout} pending`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
