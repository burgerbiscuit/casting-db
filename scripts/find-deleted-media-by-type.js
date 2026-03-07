const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  try {
    console.log(`\n🔍 MEDIA REMAINING BY TYPE\n`);

    const { data: allMedia } = await supabase
      .from('model_media')
      .select('type, model_id, is_visible');

    const byType = {};
    const modelsByType = {};

    allMedia?.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
      
      if (!modelsByType[m.type]) modelsByType[m.type] = new Set();
      modelsByType[m.type].add(m.model_id);
    });

    console.log(`📊 MEDIA RECORDS BY TYPE:\n`);
    Object.entries(byType).forEach(([type, count]) => {
      const models = modelsByType[type]?.size || 0;
      console.log(`  ${type}: ${count} files (${models} models)`);
    });

    console.log(`\n⚠️  WHAT THIS TELLS US:\n`);
    if (byType['digital'] && !byType['photo']) {
      console.log(`  ✅ "digital" uploads SURVIVED (47 files)`);
      console.log(`  ❌ "photo" uploads DELETED (most lost)`);
      console.log(`  ❌ "video" uploads MOSTLY LOST\n`);
      console.log(`  Your cleanup script deleted everything EXCEPT type='digital'\n`);
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
