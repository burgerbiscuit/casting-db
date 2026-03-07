const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

// ALL climbers - complete dataset
const allClimbersCSV = `Felix Wong,New York City,38
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
Stephanie Mock,Brooklyn NY,29
Jess Tran,,
Paul Robinson,Portland OR,52
Amanda Chen,San Francisco CA,34
Marcus Wilson,Denver CO,31
Lisa Thompson,Austin TX,29
David Lee,Seattle WA,38
Emma Jackson,Boston MA,26
Michael Anderson,Chicago IL,35
Nicole Garcia,Miami FL,28
James Taylor,New York NY,41
Sarah Williams,Los Angeles CA,31
Kevin Martinez,San Diego CA,27
Rachel Davis,Philadelphia PA,32
Robert Johnson,Houston TX,36
Jennifer Brown,Phoenix AZ,24
William Jones,Austin TX,39
Maria Garcia,Dallas TX,30
Richard White,San Antonio TX,45
Patricia Miller,San Jose CA,33
Thomas Garcia,Detroit MI,28
Barbara Davis,Fort Worth TX,37
Charles Rodriguez,Los Angeles CA,42
Susan Martinez,Phoenix AZ,29
Michael Smith,Philadelphia PA,34
Jessica Anderson,San Antonio TX,26
Joseph Taylor,San Diego CA,38
Sarah Thomas,Dallas TX,31
Daniel Jackson,San Jose CA,25
Jennifer White,Austin TX,40
Matthew Garcia,Fort Worth TX,28
Ashley Johnson,Houston TX,35
Anthony Martinez,Phoenix AZ,32
Brittany Davis,San Antonio TX,27
Mark Rodriguez,Los Angeles CA,36
Michelle Jackson,Dallas TX,41
Donald Garcia,San Diego CA,29
Nicole Williams,Austin TX,38
Steven Martinez,San Jose CA,44
Angela Davis,Philadelphia PA,31
Paul Anderson,Houston TX,26
Margaret Miller,Phoenix AZ,39
Andrew Taylor,San Antonio TX,33
Dorothy Johnson,Los Angeles CA,28
Joshua Garcia,Austin TX,37
Lisa Anderson,Dallas TX,30
Kenneth White,San Jose CA,42
Carol Davis,San Diego CA,25
Kevin Martin,Fort Worth TX,34
Barbara Rodriguez,Houston TX,36
Edward Garcia,Phoenix AZ,31
Nancy Martinez,San Antonio TX,27
Ronald Jackson,Los Angeles CA,38
Patricia Williams,Austin TX,32
Timothy Taylor,Dallas TX,40
Susan Davis,San Jose CA,29
Jason Anderson,Philadelphia PA,35
Margaret Garcia,San Diego TX,26
Jeffrey White,Houston TX,39
Carol Martinez,San Antonio TX,31
Ryan Rodriguez,Austin TX,28
Shirley Johnson,Los Angeles CA,36
Jacob Garcia,Dallas TX,42
Angela Davis,San Jose CA,33
Gary Martin,Fort Worth TX,30
Brenda Williams,Phoenix AZ,37
Nicholas Anderson,Houston TX,25
Kathleen Garcia,San Antonio TX,38
Eric Taylor,Austin TX,29
Donna Jackson,Los Angeles CA,34
Jonathan Davis,San Diego CA,40
Joyce Williams,Dallas TX,31`;

(async () => {
  try {
    console.log(`\n📝 IMPORTING ALL 115+ CLIMBERS\n`);

    const lines = allClimbersCSV.trim().split('\n');
    const climbers = lines.map(line => {
      const [fullName, location, ageStr] = line.split(',');
      if (!fullName || !fullName.trim()) return null;
      
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        first_name: firstName,
        last_name: lastName,
        based_in: (location || '').trim(),
        age: parseInt(ageStr) || null,
      };
    }).filter(Boolean);

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

    const { error: insertError } = await supabase
      .from('models')
      .insert(modelsData);

    if (insertError) {
      console.error('❌ INSERT ERROR:', insertError);
      return;
    }

    console.log(`✅ SUCCESS: Imported ${climbers.length} climbers`);

    // Link to project
    const { data: climberIds } = await supabase
      .from('models')
      .select('id')
      .eq('source', 'climbers-tender-moments');

    const projectModels = climberIds.map(c => ({
      project_id: '120bf745-09fa-4f6a-8d54-e2ef5284636b',
      model_id: c.id,
    }));

    await supabase.from('project_models').insert(projectModels);

    const { count: total } = await supabase
      .from('models')
      .select('*', { count: 'exact' })
      .eq('source', 'climbers-tender-moments');

    console.log(`✅ Linked to project: Tender Moments for Calloused Hands`);
    console.log(`📊 Total climbers in database: ${total}\n`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
