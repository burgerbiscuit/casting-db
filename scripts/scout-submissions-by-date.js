const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const { data: scouts } = await supabase
      .from('models')
      .select('created_at')
      .eq('source', 'scouting')
      .order('created_at', { ascending: true });

    if (!scouts || scouts.length === 0) {
      console.log('No scout submissions found');
      return;
    }

    const byDate = {};
    scouts.forEach(s => {
      const date = new Date(s.created_at).toLocaleDateString();
      byDate[date] = (byDate[date] || 0) + 1;
    });

    console.log(`\n📅 SCOUT SUBMISSIONS BY DATE:\n`);
    Object.entries(byDate).forEach(([date, count]) => {
      console.log(`  ${date}: ${count} submissions`);
    });

    const oldest = new Date(scouts[0].created_at);
    const newest = new Date(scouts[scouts.length - 1].created_at);
    
    console.log(`\nDate range: ${oldest.toLocaleDateString()} to ${newest.toLocaleDateString()}`);
    console.log(`Total: ${scouts.length}`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
