const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log('\n🔍 DIAGNOSING MEDIA ISSUE\n');

    // Get ALL media records
    const { data: allMedia, count: totalMedia } = await supabase
      .from('model_media')
      .select('id, model_id, type, is_visible, public_url', { count: 'exact' });

    console.log(`Total media records in database: ${totalMedia}`);

    // Get all unique model_ids referenced
    const modelIdsInMedia = [...new Set(allMedia?.map(m => m.model_id) || [])];
    console.log(`Unique models referenced in media: ${modelIdsInMedia.length}`);

    // Check which of those models exist
    const { data: existingModels } = await supabase
      .from('models')
      .select('id, first_name, last_name')
      .in('id', modelIdsInMedia);

    console.log(`Models that actually exist: ${existingModels?.length || 0}`);

    if (existingModels && existingModels.length > 0) {
      console.log(`\n✅ Sample models with media:`);
      existingModels.slice(0, 5).forEach(m => {
        const count = allMedia?.filter(med => med.model_id === m.id).length || 0;
        console.log(`  - ${m.first_name} ${m.last_name}: ${count} media files`);
      });
    }

    // Check for orphaned media (model_id doesn't exist)
    const orphanedCount = allMedia?.filter(m => !existingModels?.some(mod => mod.id === m.model_id)).length || 0;
    console.log(`\nOrphaned media (model_id not found): ${orphanedCount}`);

    // Sample media details
    console.log(`\n📋 Sample media records:`);
    allMedia?.slice(0, 5).forEach(m => {
      const modelExists = existingModels?.some(mod => mod.id === m.model_id) ? '✅' : '❌';
      console.log(`${modelExists} ID: ${m.id.substring(0, 8)}... | Type: ${m.type} | Visible: ${m.is_visible} | Model: ${m.model_id.substring(0, 8)}...`);
    });

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
