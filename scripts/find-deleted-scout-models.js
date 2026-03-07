const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n🔍 CHECKING FOR DELETED SCOUT MODELS\n`);

    // Get all model sources to see what exists
    const { data: allModels } = await supabase
      .from('models')
      .select('source, COUNT(*) as count')
      .order('source');

    // Count by source
    const sourceCount = {};
    allModels?.forEach(m => {
      sourceCount[m.source || 'NULL'] = (sourceCount[m.source || 'NULL'] || 0) + 1;
    });

    console.log(`📊 MODELS BY SOURCE:\n`);
    Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });

    // Check if scout models exist
    const { count: scoutCount } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'scout');

    console.log(`\n📋 SCOUT SUBMISSIONS IN DATABASE: ${scoutCount}`);

    if (scoutCount === 0) {
      console.log(`\n⚠️  NO SCOUT MODELS FOUND!`);
      console.log(`This means scout submissions were deleted.`);
    }

    // Get a sample of models to see what their created_at dates are
    const { data: recent } = await supabase
      .from('models')
      .select('first_name, last_name, source, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    console.log(`\n📅 RECENT 20 MODELS:\n`);
    recent?.forEach((m, i) => {
      const date = new Date(m.created_at).toLocaleDateString();
      console.log(`${i + 1}. ${m.first_name} ${m.last_name} | Source: ${m.source} | Date: ${date}`);
    });

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
