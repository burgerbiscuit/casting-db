const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    // Get models we know HAD media
    const modelNames = [
      'Callum',
      'Cristina Piccone',
      'Diana Achan',
      'Fatou Kebbeh',
      'Helga Hitko',
      'Jennie Kim',
      'KEVIN GODETTE'
    ];

    console.log(`\n🔍 CHECKING WHICH MODELS LOST MEDIA\n`);

    for (const name of modelNames) {
      const parts = name.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');

      const { data: model } = await supabase
        .from('models')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      if (!model) {
        console.log(`❌ ${name} - NOT FOUND`);
        continue;
      }

      const { count: mediaCount } = await supabase
        .from('model_media')
        .select('*', { count: 'exact' })
        .eq('model_id', model.id);

      if (mediaCount === 0) {
        console.log(`❌ ${name} - MEDIA DELETED (had media before)`);
      } else {
        console.log(`✅ ${name} - ${mediaCount} media files`);
      }
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
