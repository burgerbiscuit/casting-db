const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

// ALL climbers data - both Form Responses AND Pro Climbers
const allClimbersData = `Felix Wong,New York City,38
Sami Mekonen,Los Angeles California,26
Koraya Fay,Gilbert Arizona,19
Christa Guzmán,Brooklyn NY,24
Szohaib Khan,New York New York,21
Lindsey Martin,Queens NY,22
Christopher De Leon,Flushing New York,33
Johnatan Tamayo Penilla,Hoboken NJ,21
Katherine Nunez,Peabody MA,38
Rosie Ramassamy,Paris France,26
Victoria bell,West Jordan ut,38
Remy Yin,New York City New York,23
Ayanleh Elmi Barreh,Paris,24
Pablo Fernández,Spain,23
Caroline Schnabel,LDN VIE NYC,36
Andrew Hsu,Brooklyn NY,30
Alec Luu,Brooklyn NY,28
Adrien Joseph,NYC NY,22
Florian Guyénet,Paris,25
Ryan Cordovez,New York Queens,19
Kem Solid,Manhattan NY,35
Steve Lysak,Jersey City NJ,26
Christof Inderbitzin,New York City,23
Elias John Cabrera,Brooklyn NY,23
tallen gabriel,brooklyn ny,30
Dumarys Espaillat,New York City NY,33
Satoshi Oyanagi,New York City,55
Zainab Rehman,Brooklyn NY,27
HC SOHN,BROOKLYN,40
Sofya Bazhanova,Lima Peru,28
Jessica Navarrette,Brooklyn NY,26
Katia cadavid,New York,21
Jes Vesconte,New York NY,28
Dallas Wade,Las Vegas,32
Lauraine Laino,Farmingville NY,25
Alyssa Vu,New York New York,23
Natasha Greendyk,Brooklyn NY,32
Chris Fleischman,Westfield NJ,53
Michelle Guance,Bronx NY,29
Gavin Keller,New York,20
Michelle,Brooklyn NY,40
John Bubniak,NY,28
Joy Jiang,Brooklyn,34
Mahalia Xiaoqi,Brooklyn NY,26
Kaci Collins Jordan,New York City NY,31
Katrine Kirsebom,BROOKLYN NY,25
Katie Belloff,Brooklyn NY,31
Maxwell Stanley Gorraiz,Brooklyn NY,22
Glenn D'Avanzo,Ashland MA,59
florencia barletta,Miami,53
Jenni Poole,New York NY,29
Jose (Alex) Dias,Union NJ,53
Danielle Harper,Union City NJ,39
Peter Magnus Curry,New York NY,28
Elliott Wood,ATL GA,27
Donna H. Hansen,Denver,53
Scott Bernard Nelson,Portland Oregon,53
Debra Corley,Long Beach California,66
Jonathan Chia-Ho Lee,Los Angeles CA,40
Sarah Melgar,New York,28
Destinee,New York New York,33
Alan Johnson,Dallas Texas,37
Justin Seiller,Paramus New Jersey,27
Caroline Buddendorf,Los Angeles CA,25
Joshua Chen,Brooklyn NY,27
Madeline Lopez,BROOKLYN NEW YORK,58
Jasmine Hsu,Brooklyn NY,35
Theresa Vo,Garden Grove CA,25
Mason Sammarco,Milwaukee Wisconsin,21
Jennifer Hessel,Chicago Illinois,23
Mireille Koyounian,Vernon CT,51
Arden Lassalle,Los Angeles,29
Dee Schmitz,Lake Hopatcong NJ,53
Chad Halbrook,Denver CO,40
Stephanie Whigham,San Jose CA,46
Xixi Wang,New York NY,24
Stephanie Mock,Brooklyn NY,29`;

(async () => {
  try {
    console.log(`\n📝 IMPORTING ALL CLIMBERS (Form Responses + Pro Climbers)\n`);

    const lines = allClimbersData.trim().split('\n');
    const climbers = lines.map(line => {
      const parts = line.split(',');
      return {
        first_name: parts[0]?.trim().split(' ')[0] || '',
        last_name: parts[0]?.trim().substring(parts[0].trim().indexOf(' ') + 1) || '',
        based_in: parts[1]?.trim() || '',
        age: parseInt(parts[2]) || null,
      };
    }).filter(c => c.first_name);

    console.log(`Found ${climbers.length} climbers\n`);

    const modelsData = climbers.map(c => ({
      first_name: c.first_name,
      last_name: c.last_name,
      based_in: c.based_in,
      date_of_birth: null,
      skills: ['Climbing'],
      reviewed: false,
      source: 'climbers-tender-moments',
      created_at: new Date().toISOString(),
    }));

    const { error: insertError, data } = await supabase
      .from('models')
      .insert(modelsData);

    if (insertError) {
      console.error('❌ INSERT ERROR:', insertError);
      return;
    }

    console.log(`\n✅ SUCCESS: Imported ${climbers.length} climbers`);
    console.log(`Status: All pending review`);
    console.log(`Source: climbers-tender-moments\n`);

    // Count total climbers now
    const { count: totalClimbers } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'climbers-tender-moments');

    console.log(`Total climbers in database: ${totalClimbers}\n`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
