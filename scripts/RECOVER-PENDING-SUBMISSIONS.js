const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n🔄 RECOVERING 140 PENDING SCOUT SUBMISSIONS\n`);

    // Get all scout submissions from before 3/7 that are marked reviewed=true
    const before307 = new Date('2026-03-07').toISOString();

    const { count: toRecover, data: toRecoverRecords } = await supabase
      .from('models')
      .select('id, first_name, last_name, created_at', { count: 'exact' })
      .eq('source', 'scouting')
      .eq('reviewed', true)
      .lt('created_at', before307)
      .limit(150);

    console.log(`Found ${toRecover} mistakenly marked as reviewed (should be pending)\n`);

    if (toRecover > 0) {
      console.log(`Sample of records to recover:\n`);
      toRecoverRecords?.slice(0, 10).forEach((m, i) => {
        const date = new Date(m.created_at).toLocaleDateString();
        console.log(`  ${i + 1}. ${m.first_name} ${m.last_name} (${date})`);
      });

      console.log(`\n⏳ Waiting for confirmation...\n`);
      console.log(`Type: "I confirm recover 140 pending submissions"\n`);
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
