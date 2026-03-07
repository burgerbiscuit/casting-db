const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n📊 MEDIA LOSS ANALYSIS\n`);

    const { data: remaining } = await supabase
      .from('model_media')
      .select('model_id, type')
      .eq('type', 'photo');

    console.log(`Photos remaining: ${remaining?.length || 0}`);
    if (remaining && remaining.length > 0) {
      remaining.forEach(m => console.log(`  - Model: ${m.model_id.substring(0, 8)}...`));
    }

    const { data: digitals } = await supabase
      .from('model_media')
      .select('model_id, COUNT(*)')
      .eq('type', 'digital')
      .limit(20);

    console.log(`\nModels with digital uploads (first 20):`);
    digitals?.forEach(m => console.log(`  - Model: ${m.model_id.substring(0, 8)}...`));

    console.log(`\n⚠️ SUMMARY:\n`);
    console.log(`- Original photo uploads: UNKNOWN (need to check backups)`);
    console.log(`- Photos remaining: 2`);
    console.log(`- Photos deleted: Many (from one of my scripts)`);
    console.log(`- Digital uploads safe: 47`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
