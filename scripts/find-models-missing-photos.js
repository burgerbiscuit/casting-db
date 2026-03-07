const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpYVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n🔍 FINDING MODELS THAT LOST PHOTO UPLOADS\n`);

    // Get all models with digital media (these kept their media)
    const { data: modelsWithDigital } = await supabase
      .from('model_media')
      .select('model_id', { distinct: true })
      .eq('type', 'digital');

    const digitalModelIds = new Set(modelsWithDigital?.map(m => m.model_id) || []);

    // Get those models
    const { data: digitalModels } = await supabase
      .from('models')
      .select('id, first_name, last_name')
      .in('id', Array.from(digitalModelIds));

    console.log(`✅ MODELS WITH DIGITAL MEDIA (SAFE):\n`);
    digitalModels?.forEach(m => {
      console.log(`  • ${m.first_name} ${m.last_name}`);
    });

    // Now get known models that should have had photos
    console.log(`\n❌ MODELS MISSING PHOTOS (DELETED):\n`);
    const shouldHavePhotos = [
      'Callum', 'Stoddart',
      'Jennie Kim', 'DEMO',
      'Bad Bunny', 'DEMO',
      'Carmen Julia', '',
      'Martyna', 'Frankow'
    ];

    for (let i = 0; i < shouldHavePhotos.length; i += 2) {
      const firstName = shouldHavePhotos[i];
      const lastName = shouldHavePhotos[i + 1];
      
      const { data: model } = await supabase
        .from('models')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      if (!model) {
        console.log(`  • ${firstName} ${lastName} - RECORD DELETED`);
      } else {
        console.log(`  • ${firstName} ${lastName} - Record exists, photos gone`);
      }
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
