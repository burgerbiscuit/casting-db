const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    // Get counts by date
    const { data: allModels } = await supabase
      .from('models')
      .select('created_at, reviewed');

    if (!allModels) return;

    const byDate = {};
    allModels.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString();
      if (!byDate[date]) byDate[date] = { total: 0, pending: 0, approved: 0 };
      byDate[date].total++;
      if (m.reviewed) byDate[date].approved++;
      else byDate[date].pending++;
    });

    console.log(`\n📊 MODELS BY DATE\n`);
    Object.keys(byDate).sort().reverse().forEach(date => {
      const counts = byDate[date];
      console.log(`${date}: ${counts.total} total (${counts.pending} pending, ${counts.approved} approved)`);
    });

    // New total count
    const { count: totalNow } = await supabase
      .from('models')
      .select('*', { count: 'exact' });

    const { count: pendingNow } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('reviewed', false);

    console.log(`\n✅ CURRENT STATUS:`);
    console.log(`Total: ${totalNow}`);
    console.log(`Pending: ${pendingNow}`);
    console.log(`Approved: ${(totalNow || 0) - (pendingNow || 0)}`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
