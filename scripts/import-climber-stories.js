// Import climber stories from Google Sheet form responses
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Climber stories data extracted from the Google Sheet form responses
// Columns: Full Name, Location (City, State), Age, Home Gym, IG link, Email, Story (Why do you climb), Photo, Preference
const climberStories = [
  { name: 'Felix Wong', location: 'New York City', age: 38, homeGym: 'non at the moment', instagram: 'felinewong', email: 'felixwongphoto@gmail.com', story: 'I love the climbing community' },
  { name: 'Sami Mekonen', location: 'Los Angeles, California', age: 26, homeGym: 'Multiple Gyms. Hollywood Boulders and Touchstone Climbing', instagram: 'samimekonen_', email: 'samiamekonen@gmail.com', story: 'I like climbing cause its a stress reliever, and it helps me calm down' },
  { name: 'Koraya Fay', location: 'Gilbert, Arizona', age: 19, homeGym: 'Alta (Gilbert)', instagram: 'korayafay', email: 'Korayafay@gmail.com', story: 'The moment I started rock climbing I felt free! I instantly fell in love with the happiness and clarity that it brought me' },
  { name: 'Christa Guzmán', location: 'Brooklyn, NY', age: 24, homeGym: 'Metrorock Bushwick', instagram: 'christa.guz', email: 'christaguzman01@gmail.com', story: 'As a young Latina girl with ADHD, this was a hobby that made me feel welcomed and safe' },
  { name: 'Szohaib Khan', location: 'New York, New York', age: 21, homeGym: 'CRG Riverside, CRG Chelsea', instagram: 'szohaib_khan', email: 'szkhan914@gmail.com', story: 'I miss climbing trees. Rock climbing allows me to have fun with my friends while getting stronger' },
  { name: 'Lindsey Martin', location: 'Queens, NY', age: 22, homeGym: 'Brooklyn Boulder Queensbridge', instagram: '_lindseymartin_', email: 'linmartin1020@gmail.com', story: 'I mainly enjoy climbing for the sense of achievement and community aspect' },
  { name: 'Christopher De Leon', location: 'Flushing, New York', age: 33, homeGym: 'Metrorock', instagram: 'Kr1z', email: 'Chrisdeleon91@gmail.com', story: 'Fun social group activity' },
  { name: 'Johnatan Tamayo Penilla', location: 'Hoboken, NJ', age: 21, homeGym: 'Method climbing gym in Newark', instagram: 'johnatan_tam', email: 'Jtamayopenilla@gmail.com', story: 'Climbing has had a positive impact on my mental health' },
  { name: 'Katherine Nunez', location: 'Peabody MA', age: 38, homeGym: 'Metro Rock Everett', instagram: 'kathycnunez', email: 'Katherine.chum@yahoo.com', story: 'To move through my grief - recently widowed. Because I can do hard things' },
  { name: 'Rosie Ramassamy', location: 'Paris, France', age: 26, homeGym: 'N/A', instagram: '_rxrosie', email: 'Rosie.gabriella@live.fr', story: 'I love sport with sensation like climbing, tree climbing, trekking, skydiving' },
  { name: 'Victoria Bell', location: 'West Jordan, ut', age: 38, homeGym: 'Outdoors', instagram: 'victoriabell.jpg', email: 'Vsbell33@gmail.com', story: 'To fully expand my horizons and push my limits' },
  { name: 'Remy Yin', location: 'New York City New York', age: 23, homeGym: 'Movement', instagram: 'remyyin2nd', email: 'remy.yin@gmail.com', story: 'Its the most rewarding sport and incredibly fun and stimulating' },
  { name: 'Ayanleh Elmi Barreh', location: 'Paris', age: 24, homeGym: 'John reed', instagram: 'hedi_skinnyman', email: 'ayanleh.elmibarreh@gmail.com', story: 'Cause its rewarding funny and I feel free doing it' },
  { name: 'Pablo Fernández', location: 'Spain', age: 23, homeGym: 'Tokyo wall', instagram: 'pvbloo_', email: 'pvblofernandez@gmail.com', story: 'Something beautiful is a sport where I can challenge myself and grow every single day' },
  { name: 'Caroline Schnabel', location: 'LDN, VIE, NYC', age: 36, homeGym: 'Barry\'s, Alo studios', instagram: 'caro_schnabel', email: 'caroline.schnabel@gmx.net', story: 'Be present, live the moment as well as the mental physical component of that sport' },
  { name: 'Andrew Hsu', location: 'Brooklyn, NY', age: 30, homeGym: 'vital', instagram: 'choochoosendtrain', email: 'andrewhsu8@gmail.com', story: 'i love it. i love the community. i love moving my body. i love challenging myself' },
  { name: 'Alec Luu', location: 'Brooklyn, NY', age: 28, homeGym: 'Vital LES', instagram: 'alec.luu', email: 'hey@alecluu.com', story: 'Climbing to me is about body and wellness, but ultimately it has always been a place of connection' },
  { name: 'Adrien Joseph', location: 'NYC, NY', age: 22, homeGym: 'Vital LES', instagram: 'Adriienjoseph', email: 'Adrienjoseph810@gmail.com', story: 'Each route is like a little puzzle that takes time to figure out' },
  { name: 'Florian Guyénet', location: 'Paris', age: 25, homeGym: 'Arkose', instagram: 'ralflorian', email: 'florianguyenet@gmail.com', story: 'I climb to work on my body with fun, to challenge myself' },
  { name: 'Ryan Cordovez', location: 'New York, Queens', age: 19, homeGym: 'Movement Gowanus', instagram: 'monkeyinreallife', email: 'nyar31159@gmail.com', story: 'I climb to push myself further physically and mentally beyond the limitations' },
  { name: 'Kem Solid', location: 'Manhattan, NY', age: 35, homeGym: 'New York fitness', instagram: 'kem_solid', email: 'Kpolydore@yahoo.com', story: 'I started climbing to help my performance during Spartan races' },
  { name: 'Steve Lysak', location: 'Jersey City NJ', age: 26, homeGym: 'movement gowanus', instagram: 'stephen__lysak', email: 'stephen.lysak@gmail.com', story: 'Climbing\'s given me such a sense of community' },
  { name: 'Christof Inderbitzin', location: 'New York City', age: 23, homeGym: 'CRG', instagram: 'christof.inder', email: 'Christof.inderbitzin@gmail.com', story: 'I climb for fun and community, the joy of getting better, and it saved my life' },
  { name: 'Elias John Cabrera', location: 'Brooklyn, NY', age: 23, homeGym: 'Vital BK', instagram: 'blissedpunk', email: 'cabreraelias0121@gmail.com', story: 'Climbing for me is nurturing my spirit. Connecting with my inner-child' },
  { name: 'Tallen Gabriel', location: 'Brooklyn, NY', age: 30, homeGym: 'movement gowanus', instagram: 'captaintallen', email: 'tallie.gabriel@gmail.com', story: 'the community and sense of accomplishment + facing falure' },
  { name: 'Dumarys Espaillat', location: 'New York City, NY', age: 33, homeGym: 'Brooklyn Boulders Queensbridge', instagram: 'msmoonlightarts', email: 'd.espaillat8821@icloud.com', story: 'I love the problem solving aspect of it and the progress' },
  { name: 'Satoshi Oyanagi', location: 'New York City', age: 55, homeGym: 'Cliff and Vital BK', instagram: 'prefabworks', email: 'Yoshie.s.j@gmail.com', story: 'Meditation!' },
  { name: 'Zainab Rehman', location: 'Brooklyn NY', age: 27, homeGym: 'Vital BK', instagram: '_helloitsz_', email: 'znb.rehman68@gmail.com', story: 'I climb to overcome my fear of heights and to challenge myself' },
  { name: 'HC SOHN', location: 'BROOKLYN', age: 40, homeGym: 'Movement LIC', instagram: 'hc.sohn', email: 'Hanchang.Sohn@gmail.com', story: 'I found climbing unintentionally and was surprised by how much I enjoyed it' },
  { name: 'Sofya Bazhanova', location: 'Lima, Peru', age: 28, homeGym: 'Pirqa, Bloque', instagram: 'bsofyko', email: 'sofya0111@gmail.com', story: 'Its the best way to balance my mental health' },
  { name: 'Jessica Navarrette', location: 'Brooklyn, NY', age: 26, homeGym: 'Movement Gowanus', instagram: 'jesssickaaaa', email: 'jessicanavarrette16@gmail.com', story: 'I climb because it makes me feel alive!' },
  { name: 'Katia Cadavid', location: 'New York', age: 21, homeGym: 'Harlem vital', instagram: 'cadavidkiki', email: 'Kilicamu0323@gmail', story: 'As an ex-gymnast it was hard to get back into gymnastics as an adult' },
  { name: 'Jes Vesconte', location: 'New York, NY', age: 28, homeGym: 'LA Boulders / Central Rock Gym / GP-81', instagram: 'Jes.vesconte', email: 'Jes.vesconte@gmail.com', story: 'I came to climbing from a Parkour background' },
  { name: 'Dallas Wade', location: 'Las Vegas', age: 32, homeGym: 'Red Rock climbing', instagram: 'DallasWade_', email: 'Flashmanwade@gmail.com', story: 'I climb because its so freeing and so demanding of so many parts of you' },
  { name: 'Lauraine Laino', location: 'Farmingville, NY', age: 25, homeGym: 'Island Rock', instagram: 'laurainelaino', email: 'Lauriel1209@gmail.com', story: 'Being at a regular gym feels so isolating. Climbing builds community and trust' },
  { name: 'Alyssa Vu', location: 'New York, New York', age: 23, homeGym: 'Vital LES', instagram: 'alysssavu', email: 'alyssavu01@gmail.com', story: 'I climb because it is a form of exercise that appeals to me' },
  { name: 'Natasha Greendyk', location: 'Brooklyn, NY', age: 32, homeGym: 'Movement Gowanus', instagram: 'natashagreendyk', email: 'Greendyknv@gmail.com', story: 'Rock climbing has reconnected me with a part of myself I didn\'t realize I\'d lost' },
  { name: 'Chris Fleischman', location: 'Westfield, NJ', age: 53, homeGym: 'Gravity Vault, Chatham', instagram: 'Chris_Fleischman', email: 'Chris.fleischman@gmail.com', story: 'So many reasons. It is a metaphor for life' },
  { name: 'Michelle Guance', location: 'Bronx, NY', age: 29, homeGym: 'Movement', instagram: 'mchllllle_', email: 'Michelleguance@gmail.com', story: 'I climb because it keeps me present, it helps me feel strong' },
  { name: 'Gavin Keller', location: 'New York', age: 20, homeGym: 'Vital-not a member', instagram: 'Yogabagavin', email: 'Gavinkeller04@gmail.com', story: 'I honestly found it on kind of a whim' },
  { name: 'Michelle', location: 'Brooklyn, NY', age: 40, homeGym: 'Movement gowanus', instagram: 'michellefigs', email: 'Michellefigs@gmail.com', story: 'I climb because its fun. It conditions my body' },
  { name: 'John Bubniak', location: 'NY', age: 28, homeGym: 'Crunch/Vital', instagram: 'johnbubniak', email: 'johnbubniak@gmail.com', story: 'climbing gets me out of my head and into my body' },
  { name: 'Joy Jiang', location: 'Brooklyn', age: 34, homeGym: 'Movement Gowanus', instagram: 'joy.nyc', email: 'Joyjiang18@gmail.com', story: 'I started climbing 6 years ago as a way to make new friends' },
  { name: 'Mahalia Xiaoqi', location: 'Brooklyn, NY', age: 26, homeGym: 'Cliffs Gowanus- now Movement', instagram: 'mahaliaxs', email: 'mahalia.xiaoqi@movementgyms.com', story: 'I first climbed with my oldest childhood friend from our adoption group' },
  { name: 'Kaci Collins Jordan', location: 'New York City, NY', age: 31, homeGym: 'Movement', instagram: 'kaci_sends_sometimes', email: 'kaci.collinsjordan@gmail.com', story: 'I have been climbing for about 13 years, and at this point it is part of who I am' },
  { name: 'Katrine Kirsebom', location: 'BROOKLYN NY', age: 25, homeGym: 'Metrorock Bushwick, GOAT', instagram: 'miss__katrine__', email: 'kkirse@me.com', story: 'Its hard to say exactly why I climb, because there are so many pieces to it' },
  { name: 'Katie Belloff', location: 'Brooklyn, NY', age: 31, homeGym: 'GP81', instagram: 'kthebellz', email: 'Kbelloff22@gmail.com', story: 'My climbing community is my family' },
  { name: 'Maxwell Stanley Gorraiz', location: 'Brooklyn, NY', age: 22, homeGym: 'Movement at Gowanus', instagram: 'maxwellgorraiz', email: 'Maxwellgorraiz@gmail.com', story: 'I Boulder and top rope in the gyms here in the city but I grew up scaling cliffs in Telluride' },
  { name: 'Glenn D\'Avanzo', location: 'Ashland, MA', age: 59, homeGym: 'Olympus Health & Fitness, Lifetime, Central Rock', instagram: 'mindsetfitnut', email: 'gd76@comcast.net', story: 'Climbing initial was just another opportunity to be physical' },
  { name: 'Florencia Barletta', location: 'Miami', age: 53, homeGym: 'N/a ( home gym)', instagram: 'florenciabarletta', email: 'Florenciabarletta@gmail.com', story: 'I love to do alpine climbing' },
  { name: 'Jenni Poole', location: 'New York, NY', age: 29, homeGym: 'Vital BK', instagram: 'jennipooole', email: 'Jennipoolee@gmail.com', story: 'I climb because it helps me bridge a mind body connection' },
  { name: 'Jose (Alex) Dias', location: 'Union, NJ', age: 53, homeGym: 'Crunch', instagram: 'alex.dias1971', email: 'alex.dias.benfica@gmail.com', story: 'There are many parallels between climbing and life' },
  { name: 'Danielle Harper', location: 'Union City, NJ', age: 39, homeGym: 'Ymca', instagram: 'danimharper', email: 'Danimharper@gmail.com', story: 'I enjoy climbing, but only advanced beginner' },
  { name: 'Peter Magnus Curry', location: 'New York, NY', age: 28, homeGym: 'Metro Rock / VITAL', instagram: '', email: 'peter.magnus.curry@gmail.com', story: 'Climbing is technical and requires problem solving' },
  { name: 'Elliott Wood', location: 'ATL, GA', age: null, homeGym: 'Central Rock Gym', instagram: 'elliottlwood', email: 'elliottleighwood@gmail.com', story: 'Freedom, ability to overcome obstacles' },
  { name: 'Donna H. Hansen', location: 'Denver', age: 53, homeGym: 'The wild. Via Ferrata', instagram: 'donnasmojo', email: 'Donnasmojo@gmail.com', story: 'Remind myself I can still do it and encourage others' },
  { name: 'Scott Bernard Nelson', location: 'Portland, Oregon', age: 53, homeGym: 'The Circuit', instagram: 'scottbernardnelson', email: 'scottbernardnelson@gmail.com', story: 'I\'m in love with big-wall climbing' },
  { name: 'Debra Corley', location: 'Long Beach California', age: 66, homeGym: 'Club Studio', instagram: 'embracingturning60', email: 'tulifts@gmail.com', story: 'I started rock climbing about 10 years ago after my divorce' },
  { name: 'Jonathan Chia-Ho Lee', location: 'Los Angeles, CA', age: 40, homeGym: 'Sender One', instagram: 'jclee_md', email: 'jonchlee@gmail.com', story: 'Its a physical act that symbolizes mental processes of growth' },
  { name: 'Sarah Melgar', location: 'New York', age: 28, homeGym: 'Movement Gowanus', instagram: 'sarah_melgar3', email: 'sarah.o.melgar@gmail.com', story: 'I climb because it makes me feel strong and as a female that is something that I really value' },
  { name: 'Destinee', location: 'New York, New York', age: 33, homeGym: 'Movement LLC', instagram: 'destineeryan118', email: 'destineeryan118@gmail.com', story: 'I climb because I love taking on the challenge of a difficult course' },
  { name: 'Alan Johnson', location: 'Dallas, Texas', age: 37, homeGym: 'Equinox', instagram: 'alanjmodeling', email: 'aejohnson@me.com', story: 'I don\'t climb often, but I love when I do' },
  { name: 'Justin Seiller', location: 'Paramus, New Jersey', age: 27, homeGym: 'Gravity Vault', instagram: 'justinseiller', email: 'Justinseiller324@gmail.com', story: 'I like the substance that is within climbing' },
  { name: 'Caroline Buddendorf', location: 'Los Angeles, CA', age: 25, homeGym: 'Hollywood boulders', instagram: 'caroline_buddendorf', email: 'caroline.buddendorf@gmail.com', story: 'I climb because it makes me feel present and mindful' },
  { name: 'Joshua Chen', location: 'Brooklyn, NY', age: 27, homeGym: 'Seattle Bouldering Project', instagram: 'illiteratejosh', email: '1997joshuachen@gmail.com', story: 'I like the excitement that it provides' },
  { name: 'Madeline Lopez', location: 'BROOKLYN NEW YORK', age: 58, homeGym: 'Harbor Fotness', instagram: 'Madeline8497', email: 'Madelinelopez1313@gmail.com', story: 'Freedoms! Challenge' },
  { name: 'Jasmine Hsu', location: 'Brooklyn, NY', age: 35, homeGym: 'Vital BK, Vital LES', instagram: 'allezjas', email: 'jasminechsu@gmail.com', story: 'Mental health, self-confidence, and feeling strong for the first time in my life' },
  { name: 'Theresa Vo', location: 'Garden Grove, CA', age: 25, homeGym: 'Hangar 18 Orange, Movement Fountain Valley', instagram: 'tree.vo', email: 'Connect.Theresavo@gmail.com', story: 'Not only is climbing a means of exercise, it inspires me to achieve more in life' },
  { name: 'Mason Sammarco', location: 'Milwaukee, Wisconsin', age: 21, homeGym: 'Adventure Rock Milwaukee', instagram: 'masonsammarco', email: 'masonsammarco@gmail.com', story: 'I climb to push my limits' },
  { name: 'Jennifer Hessel', location: 'Chicago, Illinois', age: 23, homeGym: 'First Ascent Chicago', instagram: 'itsj3nnnn', email: 'jxnnhxssxl@gmail.com', story: 'I climb as a way to move my body in a way that also stimulates my mind' },
  { name: 'Xixi Wang', location: 'New York, NY', age: 24, homeGym: 'Vital West Harlem', instagram: 'imxixiwang', email: 'xixiw615@gmail.com', story: 'I started climbing because I wanted to feel stronger' },
];

async function importClimberStories() {
  console.log(`Starting import of ${climberStories.length} climber story records...`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const climber of climberStories) {
    try {
      const nameParts = climber.name.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if already exists
      const { data: existing } = await supabase
        .from('models')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      if (existing) {
        console.log(`⊘ Skipped: ${climber.name} (already exists)`);
        skipped++;
        continue;
      }

      // Clean Instagram handle
      const instagram = (climber.instagram || '').replace(/^@+\s*/, '').trim();

      // Insert new model
      const { data: newModel, error: insertError } = await supabase
        .from('models')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: climber.email || null,
          instagram_handle: instagram || null,
          based_in: climber.location || null,
          notes: climber.story || null,
          reviewed: true,
          source: 'climber_stories_import',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`✗ Error importing ${climber.name}:`, insertError.message);
        errors++;
        continue;
      }

      console.log(`✓ Imported: ${climber.name}`);
      imported++;

    } catch (err) {
      console.error(`✗ Exception for ${climber.name}:`, err.message);
      errors++;
    }
  }

  console.log(`\n=== IMPORT SUMMARY ===`);
  console.log(`✓ Imported: ${imported}`);
  console.log(`⊘ Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`Total processed: ${imported + skipped + errors}`);
}

importClimberStories().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
