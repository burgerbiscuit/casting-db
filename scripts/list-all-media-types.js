const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const { data: allMedia } = await supabase
      .from('model_media')
      .select('type')
      .limit(1000);

    const typeCount = {};
    allMedia?.forEach(m => {
      typeCount[m.type] = (typeCount[m.type] || 0) + 1;
    });

    console.log(`\n📊 ALL MEDIA TYPES IN DATABASE\n`);
    Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

    const total = Object.values(typeCount).reduce((a, b) => a + b, 0);
    console.log(`\nTotal: ${total}\n`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
