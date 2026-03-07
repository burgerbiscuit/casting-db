const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const { data: allMedia } = await supabase
      .from('model_media')
      .select('type, model_id, created_at')
      .order('created_at', { ascending: false });

    const byType = {};
    const byDate = {};

    allMedia?.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
      const date = new Date(m.created_at).toLocaleDateString();
      if (!byDate[date]) byDate[date] = {};
      byDate[date][m.type] = (byDate[date][m.type] || 0) + 1;
    });

    console.log(`\n📊 MEDIA BREAKDOWN BY TYPE\n`);
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log(`\n📅 MEDIA BY DATE & TYPE\n`);
    Object.entries(byDate).forEach(([date, types]) => {
      console.log(`${date}:`);
      Object.entries(types).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    });

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
