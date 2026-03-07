const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const { data: allMedia } = await supabase
      .from('model_media')
      .select('type');

    const types = {};
    allMedia?.forEach(m => {
      const t = m.type || 'NULL';
      types[t] = (types[t] || 0) + 1;
    });

    console.log(`\n📊 MEDIA TYPE BREAKDOWN\n`);
    Object.entries(types).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log(`\nTotal: ${allMedia?.length}`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
