const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n📋 SCOUT SUBMISSION AUDIT\n`);

    const { count: scoutingCount, data: scoutingModels } = await supabase
      .from('models')
      .select('id, first_name, last_name, created_at, reviewed', { count: 'exact' })
      .eq('source', 'scouting')
      .order('created_at', { ascending: false })
      .limit(100);

    console.log(`Total scout submissions in database: ${scoutingCount}\n`);
    console.log(`Sample (first 30):\n`);

    scoutingModels?.slice(0, 30).forEach((m, i) => {
      const date = new Date(m.created_at).toLocaleDateString();
      const status = m.reviewed ? '✅ Approved' : '⏳ Pending';
      console.log(`${i + 1}. ${m.first_name} ${m.last_name} (${date}) ${status}`);
    });

    // Check for gaps in dates
    console.log(`\n📅 DATE RANGE:`);
    if (scoutingModels && scoutingModels.length > 0) {
      const newest = new Date(scoutingModels[0].created_at);
      const oldest = new Date(scoutingModels[scoutingModels.length - 1].created_at);
      console.log(`  Newest: ${newest.toLocaleDateString()}`);
      console.log(`  Oldest: ${oldest.toLocaleDateString()}`);
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
