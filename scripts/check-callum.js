const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    const callumId = 'ee66c800-7cff-4129-85f3-d8830b856bfc';
    
    // Get Callum
    const { data: callum } = await supabase
      .from('models')
      .select('id, first_name, last_name')
      .eq('id', callumId)
      .single();

    console.log(`\nCallum: ${callum?.first_name} ${callum?.last_name}`);

    // Check media
    const { data: media, count } = await supabase
      .from('model_media')
      .select('*', { count: 'exact' })
      .eq('model_id', callumId);

    console.log(`Media records: ${count}`);
    
    if (media && media.length > 0) {
      console.log(`\n✅ Media still exists:`);
      media.forEach((m, i) => {
        console.log(`${i + 1}. Type: ${m.type} | Visible: ${m.is_visible} | URL: ${m.public_url?.substring(0, 70)}...`);
      });
    } else {
      console.log(`\n❌ NO MEDIA FOUND`);
      console.log(`Media was deleted from the database`);
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
