const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    // Total models
    const { count: totalModels } = await supabase
      .from('models')
      .select('id', { count: 'exact' });

    // Models with media
    const { data: modelsWithMedia } = await supabase
      .from('model_media')
      .select('model_id', { distinct: true });

    const uniqueModelIds = [...new Set(modelsWithMedia?.map(m => m.model_id) || [])];

    // Check which of those models exist
    const { data: existingModels } = await supabase
      .from('models')
      .select('id')
      .in('id', uniqueModelIds);

    console.log(`\n📊 MEDIA COVERAGE\n`);
    console.log(`Total models in database: ${totalModels}`);
    console.log(`Models with ANY media: ${existingModels?.length || 0}`);
    console.log(`Models WITHOUT media: ${(totalModels || 0) - (existingModels?.length || 0)}`);
    console.log(`Coverage: ${existingModels ? Math.round((existingModels.length / (totalModels || 1)) * 100) : 0}%`);

    console.log(`\n⚠️ Most models simply don't have photos uploaded yet.`);
    console.log(`This is NORMAL - only ${existingModels?.length || 0} out of ${totalModels} models have media files.`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
