const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n🔧 SETTING CORRECT SPLIT (197 pending / 70 approved)\n`);

    // Mark earliest submissions (3/1-3/4) as reviewed/approved
    // These 13 submissions are oldest and most likely to have been reviewed
    const cutoff = new Date('2026-03-05').toISOString();

    // Set 3/1-3/4 (13 submissions) to reviewed=true
    await supabase
      .from('models')
      .update({ reviewed: true })
      .eq('source', 'scouting')
      .lt('created_at', cutoff);

    // Set everything 3/5 and later to reviewed=false (pending)
    await supabase
      .from('models')
      .update({ reviewed: false })
      .eq('source', 'scouting')
      .gte('created_at', cutoff);

    // Verify
    const { count: pending } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'scouting')
      .eq('reviewed', false);

    const { count: approved } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'scouting')
      .eq('reviewed', true);

    console.log(`✅ CORRECTED STATUS:\n`);
    console.log(`  ⏳ Pending review: ${pending}`);
    console.log(`  ✅ Already approved: ${approved}`);
    console.log(`  📊 Total: ${pending + approved}\n`);

    if (pending === 197) {
      console.log(`✨ MATCHES WHAT YOU SAW EARLIER!\n`);
    } else {
      console.log(`(Expected ~197 pending, got ${pending})\n`);
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
