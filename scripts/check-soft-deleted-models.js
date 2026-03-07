const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n🔍 CHECKING FOR SOFT-DELETED DATA\n`);

    // Check if is_deleted column exists and has any records
    const { data: softDeleted, count: softDeletedCount, error } = await supabase
      .from('models')
      .select('id, first_name, last_name, source, deleted_at', { count: 'exact' })
      .eq('is_deleted', true);

    if (error && error.message.includes('is_deleted')) {
      console.log(`❌ Column is_deleted doesn't exist yet on models table`);
      console.log(`(Just added in migration, not yet applied to database)\n`);
    } else {
      console.log(`✅ Soft-deleted records found: ${softDeletedCount}\n`);
      if (softDeleted && softDeleted.length > 0) {
        console.log(`Recoverable records:`);
        softDeleted.forEach(m => {
          console.log(`  • ${m.first_name} ${m.last_name} (source: ${m.source})`);
        });
      }
    }

    // Try to check model count by checking all records (including deleted)
    const { count: totalWithDeleted } = await supabase
      .from('models')
      .select('*', { count: 'exact' });

    console.log(`\nTotal models in database (including soft-deleted): ${totalWithDeleted}`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
