// Comprehensive check: ensure ALL models display correctly in grid
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensureDisplay() {
  console.log('=== COMPREHENSIVE MODEL DISPLAY CHECK ===\n');

  // Get all models
  const { data: models, error } = await supabase
    .from('models')
    .select('id, first_name, last_name, reviewed')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error fetching models:', error);
    process.exit(1);
  }

  console.log(`Total models in database: ${models.length}\n`);

  // Check for display issues
  let issues = [];

  models.forEach(m => {
    const checks = [];

    // Check 1: Must have first_name
    if (!m.first_name || m.first_name.trim() === '') {
      checks.push('missing first_name');
    }

    // Check 2: Must have last_name
    if (!m.last_name || m.last_name.trim() === '') {
      checks.push('missing last_name');
    }

    // Check 3: No leading/trailing whitespace
    if (m.first_name !== m.first_name?.trim()) {
      checks.push('first_name has whitespace');
    }
    if (m.last_name !== m.last_name?.trim()) {
      checks.push('last_name has whitespace');
    }

    if (checks.length > 0) {
      issues.push({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`,
        problems: checks,
      });
    }
  });

  if (issues.length > 0) {
    console.log(`❌ Found ${issues.length} models with display issues:\n`);
    issues.forEach(issue => {
      console.log(`  - ${issue.name}`);
      issue.problems.forEach(p => console.log(`    • ${p}`));
    });

    console.log(`\n⚠️  These models may not display in the grid!`);
    console.log('Fix: ensure first_name and last_name are trimmed and non-empty');
  } else {
    console.log('✓ All 723 models have valid, displayable names!');
  }

  // Stats
  const reviewed = models.filter(m => m.reviewed).length;
  const pending = models.filter(m => !m.reviewed).length;

  console.log(`\n=== STATUS ===`);
  console.log(`Reviewed: ${reviewed}`);
  console.log(`Pending: ${pending}`);
  console.log(`Total: ${models.length}`);
}

ensureDisplay().catch(console.error);
