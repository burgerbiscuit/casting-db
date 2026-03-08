const { createClient } = require('@supabase/supabase-js');

// Use service role with auth hook secret
const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

(async () => {
  const email = 't@walkingonwaterny.com';
  const name = 'Tyler Mason';
  const APP_URL = 'https://cast.tashatongpreecha.com';

  // Check if already in auth
  const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
  
  let userId;
  if (existing) {
    console.log('✅ User already in auth:', existing.id);
    userId = existing.id;
  } else {
    // Try signup instead of invite (bypasses the hook)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { name },
    });
    if (error) { console.error('Create user error:', error.message); return; }
    userId = data.user.id;
    console.log('✅ Created auth user:', userId);

    // Now generate invite link manually
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: APP_URL + '/client' },
    });
    if (linkErr) console.log('Note: Could not generate invite link:', linkErr.message);
    else console.log('✅ Invite link generated');
  }

  // Create the client_profiles record
  const { error: profileErr } = await supabase.from('client_profiles').upsert({ 
    user_id: userId, name, email 
  }, { onConflict: 'user_id' });
  
  if (profileErr) { console.error('Profile error:', profileErr.message); return; }

  const { data: profile } = await supabase.from('client_profiles').select('*').eq('email', email).single();
  console.log('\n✅ Tyler Mason now in admin clients:', JSON.stringify(profile, null, 2));
  console.log('\nNext: Use the Resend Invite button on the admin clients page to send him the login email.');
})();
