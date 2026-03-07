const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const { data: mediaModels } = await supabase
      .from('model_media')
      .select('model_id', { distinct: true });

    const modelIds = [...new Set(mediaModels?.map(m => m.model_id) || [])];

    const { data: models } = await supabase
      .from('models')
      .select('id, first_name, last_name')
      .in('id', modelIds)
      .order('first_name');

    console.log(`\n✅ MODELS WITH PHOTOS (${models?.length || 0}):\n`);
    models?.forEach(m => {
      console.log(`  • ${m.first_name} ${m.last_name}`);
    });

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
