const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const modelNames = [
      ['Martyna', 'Frankow'],
      ['Bad Bunny', 'DEMO'],
      ['Carmen', 'Julia'],
      ['Jennie Kim', 'DEMO']
    ];

    console.log(`\n🔍 CHECKING DELETED MODELS\n`);

    for (const [firstName, lastName] of modelNames) {
      const { data: model } = await supabase
        .from('models')
        .select('id, first_name, last_name, created_at')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      if (!model) {
        console.log(`❌ ${firstName} ${lastName} - MODEL DELETED`);
        continue;
      }

      const { count: mediaCount } = await supabase
        .from('model_media')
        .select('*', { count: 'exact' })
        .eq('model_id', model.id);

      if (mediaCount === 0) {
        console.log(`❌ ${firstName} ${lastName} - MEDIA DELETED (ID: ${model.id})`);
      } else {
        console.log(`✅ ${firstName} ${lastName} - EXISTS with ${mediaCount} media`);
      }
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
