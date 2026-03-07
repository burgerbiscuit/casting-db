const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  console.log(`\n📊 DETAILED LOSS ANALYSIS\n`);

  const models = [
    ['Callum ', 'Stoddart'],
    ['Jennie Kim', 'DEMO'],
    ['Bad Bunny', 'DEMO'],
    ['Carmen Julia', ''],
    ['Martyna', 'Frankow']
  ];

  for (const [fn, ln] of models) {
    const { data: model } = await supabase
      .from('models')
      .select('id')
      .eq('first_name', fn)
      .eq('last_name', ln)
      .maybeSingle();

    if (!model) {
      console.log(`❌ ${fn} ${ln}: MODEL RECORD DELETED`);
    } else {
      const { count } = await supabase
        .from('model_media')
        .select('*', { count: 'exact' })
        .eq('model_id', model.id);

      if (count === 0) {
        console.log(`⚠️  ${fn} ${ln}: Record exists, ALL media DELETED`);
      } else {
        console.log(`✅ ${fn} ${ln}: Record exists, ${count} media files remain`);
      }
    }
  }
})();
