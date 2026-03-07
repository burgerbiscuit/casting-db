const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const { count: total } = await supabase
      .from('models')
      .select('*', { count: 'exact' });

    const { count: pending } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('reviewed', false);

    const { count: approved } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('reviewed', true);

    console.log(`\n📊 CURRENT DATABASE STATUS\n`);
    console.log(`Total models: ${total}`);
    console.log(`Pending review (reviewed=false): ${pending}`);
    console.log(`Approved (reviewed=true): ${approved}`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
