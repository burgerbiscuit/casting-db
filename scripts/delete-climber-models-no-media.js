const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log('Deleting climber models (source="climbers-tender-moments")...\n');

    // Get all climber models
    const { data: climbers } = await supabase
      .from('models')
      .select('id')
      .eq('source', 'climbers-tender-moments');

    if (!climbers || climbers.length === 0) {
      console.log('No climber models to delete');
      return;
    }

    const climberIds = climbers.map(c => c.id);

    // Delete all related records
    console.log(`Deleting from presentation_models...`);
    await supabase.from('presentation_models').delete().in('model_id', climberIds);

    console.log(`Deleting from project_models...`);
    await supabase.from('project_models').delete().in('model_id', climberIds);

    console.log(`Deleting from model_media...`);
    await supabase.from('model_media').delete().in('model_id', climberIds);

    console.log(`Deleting climber models...`);
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('source', 'climbers-tender-moments');

    if (error) {
      console.error('Error deleting:', error);
      return;
    }

    console.log(`\n✅ Deleted ${climbers.length} climber models and all their related data`);
    console.log(`Original models should now be fully restored`);

  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
