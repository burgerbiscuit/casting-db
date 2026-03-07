const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log('Restoring models created today (3/7/2026) to pending status...\n');

    // Get all models created today
    const today = new Date('2026-03-07');
    const tomorrow = new Date('2026-03-08');

    const { data: modelsCreatedToday } = await supabase
      .from('models')
      .select('id, first_name, last_name, reviewed')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (!modelsCreatedToday || modelsCreatedToday.length === 0) {
      console.log('No models created today found');
      return;
    }

    const reviewed = modelsCreatedToday.filter(m => m.reviewed).length;
    const pending = modelsCreatedToday.filter(m => !m.reviewed).length;

    console.log(`Models created today: ${modelsCreatedToday.length}`);
    console.log(`  Currently reviewed: ${reviewed}`);
    console.log(`  Currently pending: ${pending}`);

    // Set all to reviewed=false
    const { error } = await supabase
      .from('models')
      .update({ reviewed: false })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n✅ RESTORED! Set all ${modelsCreatedToday.length} models created today to pending review`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
