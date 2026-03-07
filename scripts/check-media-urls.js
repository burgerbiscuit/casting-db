const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const { data: media } = await supabase
      .from('model_media')
      .select('id, model_id, type, public_url')
      .limit(10);

    console.log(`\n🔗 SAMPLE MEDIA URLS\n`);
    
    media?.forEach((m, i) => {
      console.log(`${i + 1}. Type: ${m.type}`);
      console.log(`   URL: ${m.public_url}`);
      console.log(`   Valid: ${m.public_url?.includes('supabase.co') ? '✅' : '❌'}\n`);
    });

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
