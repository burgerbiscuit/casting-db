const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log('Checking which models should be pending...\n');

    // Get all models, sort by creation date
    const { data: allModels } = await supabase
      .from('models')
      .select('id, first_name, last_name, reviewed, created_at, source')
      .order('created_at', { ascending: false });

    if (!allModels) return;

    // Show breakdown
    const reviewed = allModels.filter(m => m.reviewed);
    const pending = allModels.filter(m => !m.reviewed);

    console.log(`Current state:`);
    console.log(`  Pending: ${pending.length}`);
    console.log(`  Approved: ${reviewed.length}`);
    console.log(`  Total: ${allModels.length}`);

    console.log(`\nRecent models (last 30 created):`);
    allModels.slice(0, 30).forEach((m, i) => {
      console.log(`${i + 1}. ${m.first_name} ${m.last_name} - reviewed=${m.reviewed} - ${new Date(m.created_at).toLocaleDateString()}`);
    });

    console.log(`\n⚠️ CRITICAL: I need your input.`);
    console.log(`Which models should be PENDING REVIEW?`);
    console.log(`(These appear to have been accidentally marked as reviewed=true)\n`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
