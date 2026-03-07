const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n🔍 FULL DAMAGE ASSESSMENT\n`);

    // Total models
    const { count: totalModels } = await supabase
      .from('models')
      .select('*', { count: 'exact' });

    console.log(`📊 TOTAL MODELS: ${totalModels}\n`);

    // By source
    const { data: models } = await supabase
      .from('models')
      .select('source');

    const sourceCounts = {};
    models?.forEach(m => {
      const src = m.source || 'NO_SOURCE';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    console.log(`📋 MODELS BY SOURCE:\n`);
    Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });

    // Media coverage
    const { data: mediaModels } = await supabase
      .from('model_media')
      .select('model_id', { distinct: true });

    const uniqueMediaModels = new Set(mediaModels?.map(m => m.model_id) || []);

    console.log(`\n📸 MEDIA STATUS:`);
    console.log(`  Models with media: ${uniqueMediaModels.size}`);
    console.log(`  Models without media: ${totalModels - uniqueMediaModels.size}`);
    console.log(`  Coverage: ${((uniqueMediaModels.size / totalModels) * 100).toFixed(1)}%`);

    // By reviewed status
    const { count: pending } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('reviewed', false);

    console.log(`\n✅ REVIEW STATUS:`);
    console.log(`  Pending: ${pending}`);
    console.log(`  Approved: ${totalModels - pending}`);

    // Check for models missing media that should have it
    console.log(`\n⚠️  MODELS THAT LOST MEDIA:\n`);
    const knownLostMedia = [
      'Callum Stoddart',
      'Jennie Kim DEMO',
      'Martyna Frankow',
      'Carmen Julia',
      'Bad Bunny DEMO'
    ];

    for (const name of knownLostMedia) {
      const parts = name.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');

      const { data: model } = await supabase
        .from('models')
        .select('id, first_name, last_name')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      if (!model) {
        console.log(`  ❌ ${name} - MODEL DELETED`);
      } else {
        const { count: mediaCount } = await supabase
          .from('model_media')
          .select('*', { count: 'exact' })
          .eq('model_id', model.id);

        if (mediaCount === 0) {
          console.log(`  ⚠️  ${name} - MEDIA DELETED (record exists)`);
        }
      }
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
