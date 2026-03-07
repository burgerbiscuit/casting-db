const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const { count: totalMedia, data: sample } = await supabase
      .from('model_media')
      .select('*', { count: 'exact' })
      .limit(5);

    console.log(`\nTotal media records: ${totalMedia}`);
    
    if (sample && sample.length > 0) {
      console.log(`\nSample media (first 5):`);
      sample.forEach(m => {
        console.log(`  Type: ${m.type} | Model: ${m.model_id} | Visible: ${m.is_visible}`);
      });
    } else {
      console.log(`\n⚠️ MODEL_MEDIA TABLE IS EMPTY!`);
    }

    // Check if table exists
    const { data: tableInfo, error } = await supabase
      .from('model_media')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`\n❌ TABLE ERROR: ${error.message}`);
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
