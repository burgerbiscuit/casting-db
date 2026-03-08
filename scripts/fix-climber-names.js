// Fix climber stories with missing last_name
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All 71 climber stories (from import script)
const climberStories = [
  { fullName: 'Felix Wong', location: 'New York City' },
  { fullName: 'Sami Mekonen', location: 'Los Angeles, California' },
  { fullName: 'Koraya Fay', location: 'Gilbert, Arizona' },
  { fullName: 'Christa Guzmán', location: 'Brooklyn, NY' },
  { fullName: 'Szohaib Khan', location: 'New York, New York' },
  { fullName: 'Lindsey Martin', location: 'Queens, NY' },
  { fullName: 'Christopher De Leon', location: 'Flushing, New York' },
  { fullName: 'Johnatan Tamayo Penilla', location: 'Hoboken, NJ' },
  { fullName: 'Katherine Nunez', location: 'Peabody MA' },
  { fullName: 'Rosie Ramassamy', location: 'Paris, France' },
  { fullName: 'Victoria Bell', location: 'West Jordan, ut' },
  { fullName: 'Remy Yin', location: 'New York City New York' },
  { fullName: 'Ayanleh Elmi Barreh', location: 'Paris' },
  { fullName: 'Pablo Fernández', location: 'Spain' },
  { fullName: 'Caroline Schnabel', location: 'LDN, VIE, NYC' },
  { fullName: 'Andrew Hsu', location: 'Brooklyn, NY' },
  { fullName: 'Alec Luu', location: 'Brooklyn, NY' },
  { fullName: 'Adrien Joseph', location: 'NYC, NY' },
  { fullName: 'Florian Guyénet', location: 'Paris' },
  { fullName: 'Ryan Cordovez', location: 'New York, Queens' },
  { fullName: 'Kem Solid', location: 'Manhattan, NY' },
  { fullName: 'Steve Lysak', location: 'Jersey City NJ' },
  { fullName: 'Christof Inderbitzin', location: 'New York City' },
  { fullName: 'Elias John Cabrera', location: 'Brooklyn, NY' },
  { fullName: 'Tallen Gabriel', location: 'Brooklyn, NY' },
  { fullName: 'Dumarys Espaillat', location: 'New York City, NY' },
  { fullName: 'Satoshi Oyanagi', location: 'New York City' },
  { fullName: 'Zainab Rehman', location: 'Brooklyn NY' },
  { fullName: 'HC SOHN', location: 'BROOKLYN' },
  { fullName: 'Sofya Bazhanova', location: 'Lima, Peru' },
  { fullName: 'Jessica Navarrette', location: 'Brooklyn, NY' },
  { fullName: 'Katia Cadavid', location: 'New York' },
  { fullName: 'Jes Vesconte', location: 'New York, NY' },
  { fullName: 'Dallas Wade', location: 'Las Vegas' },
  { fullName: 'Lauraine Laino', location: 'Farmingville, NY' },
  { fullName: 'Alyssa Vu', location: 'New York, New York' },
  { fullName: 'Natasha Greendyk', location: 'Brooklyn, NY' },
  { fullName: 'Chris Fleischman', location: 'Westfield, NJ' },
  { fullName: 'Michelle Guance', location: 'Bronx, NY' },
  { fullName: 'Gavin Keller', location: 'New York' },
  { fullName: 'Michelle', location: 'Brooklyn, NY' },
  { fullName: 'John Bubniak', location: 'NY' },
  { fullName: 'Joy Jiang', location: 'Brooklyn' },
  { fullName: 'Mahalia Xiaoqi', location: 'Brooklyn, NY' },
  { fullName: 'Kaci Collins Jordan', location: 'New York City, NY' },
  { fullName: 'Katrine Kirsebom', location: 'BROOKLYN NY' },
  { fullName: 'Katie Belloff', location: 'Brooklyn, NY' },
  { fullName: 'Maxwell Stanley Gorraiz', location: 'Brooklyn, NY' },
  { fullName: 'Glenn D\'Avanzo', location: 'Ashland, MA' },
  { fullName: 'Florencia Barletta', location: 'Miami' },
  { fullName: 'Jenni Poole', location: 'New York, NY' },
  { fullName: 'Jose (Alex) Dias', location: 'Union, NJ' },
  { fullName: 'Danielle Harper', location: 'Union City, NJ' },
  { fullName: 'Peter Magnus Curry', location: 'New York, NY' },
  { fullName: 'Elliott Wood', location: 'ATL, GA' },
  { fullName: 'Donna H. Hansen', location: 'Denver' },
  { fullName: 'Scott Bernard Nelson', location: 'Portland, Oregon' },
  { fullName: 'Debra Corley', location: 'Long Beach California' },
  { fullName: 'Jonathan Chia-Ho Lee', location: 'Los Angeles, CA' },
  { fullName: 'Sarah Melgar', location: 'New York' },
  { fullName: 'Destinee', location: 'New York, New York' },
  { fullName: 'Alan Johnson', location: 'Dallas, Texas' },
  { fullName: 'Justin Seiller', location: 'Paramus, New Jersey' },
  { fullName: 'Caroline Buddendorf', location: 'Los Angeles, CA' },
  { fullName: 'Joshua Chen', location: 'Brooklyn, NY' },
  { fullName: 'Madeline Lopez', location: 'BROOKLYN NEW YORK' },
  { fullName: 'Jasmine Hsu', location: 'Brooklyn, NY' },
  { fullName: 'Theresa Vo', location: 'Garden Grove, CA' },
  { fullName: 'Mason Sammarco', location: 'Milwaukee, Wisconsin' },
  { fullName: 'Jennifer Hessel', location: 'Chicago, Illinois' },
  { fullName: 'Xixi Wang', location: 'New York, NY' },
];

async function fixNames() {
  console.log(`Fixing ${climberStories.length} climber story names...\n`);

  let fixed = 0;
  let notFound = [];

  for (const climber of climberStories) {
    const parts = climber.fullName.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || null;

    // Find by first name
    let model;
    try {
      const { data } = await supabase
        .from('models')
        .select('id, first_name, last_name')
        .ilike('first_name', firstName);
      model = data && data.length > 0 ? data[0] : null;
    } catch (err) {
      model = null;
    }

    if (!model) {
      notFound.push(climber.fullName);
      continue;
    }

    // Update if last_name is null
    if (!model.last_name) {
      const { error } = await supabase
        .from('models')
        .update({ last_name: lastName })
        .eq('id', model.id);

      if (!error) {
        console.log(`✓ Fixed: ${firstName} → ${climber.fullName}`);
        fixed++;
      } else {
        console.log(`✗ Error fixing ${climber.fullName}`);
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Not found: ${notFound.length}`);

  if (notFound.length > 0) {
    console.log('\nNot found:');
    notFound.forEach(n => console.log(`  - ${n}`));
  }
}

fixNames().catch(console.error);
