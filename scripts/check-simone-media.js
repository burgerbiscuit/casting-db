const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    // Find Simone Biles DEMO
    const { data: simone } = await supabase
      .from('models')
      .select('id, first_name, last_name')
      .eq('first_name', 'Simone')
      .eq('last_name', 'Biles DEMO')
      .single();

    if (!simone) {
      console.log('Simone Biles DEMO not found');
      return;
    }

    console.log(`\nFound: ${simone.first_name} ${simone.last_name}`);
    console.log(`ID: ${simone.id}`);

    // Check media
    const { data: media } = await supabase
      .from('model_media')
      .select('*')
      .eq('model_id', simone.id);

    console.log(`\nMedia count: ${media?.length || 0}`);
    
    if (media && media.length > 0) {
      console.log(`\nMedia details:`);
      media.forEach((m, i) => {
        console.log(`${i + 1}. Type: ${m.type} | URL: ${m.public_url?.substring(0, 80)}...`);
      });
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
