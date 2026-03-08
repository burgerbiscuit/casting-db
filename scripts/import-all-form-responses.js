// Import ALL climber stories from Form Responses CSV
// Handles duplicates and new entries automatically
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// COMPLETE list of all climber story entries from Form Responses CSV
const allClimerStories = [
  { name: 'Felix Wong', location: 'New York City', age: 38, homeGym: 'non at the moment', instagram: 'https://www.instagram.com/felinewong/', email: 'felixwongphoto@gmail.com', story: 'I love the climbing community' },
  { name: 'Sami Mekonen', location: 'Los Angeles, California', age: 26, homeGym: 'Multiple Gyms', instagram: 'https://www.instagram.com/samimekonen_/', email: 'samiamekonen@gmail.com', story: 'I like climbing cause its a stress reliever' },
  { name: 'Koraya Fay', location: 'Gilbert, Arizona', age: 19, homeGym: 'Alta (Gilbert)', instagram: 'https://www.instagram.com/korayafay', email: 'Korayafay@gmail.com', story: 'The moment I started rock climbing I felt free!' },
  { name: 'Christa Guzmán', location: 'Brooklyn, NY', age: 24, homeGym: 'Metrorock Bushwick', instagram: 'https://www.instagram.com/christa.guz/', email: 'christaguzman01@gmail.com', story: 'As a young Latina girl with ADHD, climbing was a hobby that made me feel welcomed' },
  { name: 'Szohaib Khan', location: 'New York, New York', age: 21, homeGym: 'CRG Riverside, CRG Chelsea', instagram: 'https://www.instagram.com/szohaib_khan/', email: 'szkhan914@gmail.com', story: 'I miss climbing trees' },
  { name: 'Lindsey Martin', location: 'Queens, NY', age: 22, homeGym: 'Brooklyn Boulder Queensbridge', instagram: 'https://instagram.com/_lindseymartin_', email: 'linmartin1020@gmail.com', story: 'I mainly enjoy climbing for the sense of achievement' },
  { name: 'Christopher De Leon', location: 'Flushing, New York', age: 33, homeGym: 'Metrorock', instagram: 'Kr1z', email: 'Chrisdeleon91@gmail.com', story: 'Fun social group activity' },
  { name: 'Johnatan Tamayo Penilla', location: 'Hoboken, NJ', age: 21, homeGym: 'Method climbing gym in Newark', instagram: 'https://www.instagram.com/johnatan_tam/', email: 'Jtamayopenilla@gmail.com', story: 'Climbing has had a positive impact on my mental health' },
  { name: 'Katherine Nunez', location: 'Peabody MA', age: 38, homeGym: 'Metro Rock Everett', instagram: 'https://www.instagram.com/kathycnunez/', email: 'Katherine.chum@yahoo.com', story: 'To move through my grief - recently widowed' },
  { name: 'Rosie Ramassamy', location: 'Paris, France', age: 26, homeGym: 'N/A', instagram: '_rxrosie', email: 'Rosie.gabriella@live.fr', story: 'I love sport with sensation like climbing' },
  { name: 'Victoria bell', location: 'West Jordan, ut', age: 38, homeGym: 'I make climb outdoors', instagram: 'https://www.instagram.com/victoriabell.jpg/', email: 'Vsbell33@gmail.com', story: 'To fully expand my horizons and push my limits' },
  { name: 'Remy Yin', location: 'New York City New York', age: 23, homeGym: 'Movement', instagram: 'https://www.instagram.com/remyyin2nd/', email: 'remy.yin@gmail.com', story: 'It\'s the most rewarding sport' },
  { name: 'Ayanleh Elmi Barreh', location: 'Paris', age: 24, homeGym: 'John reed', instagram: 'https://www.instagram.com/hedi_skinnyman/', email: 'ayanleh.elmibarreh@gmail.com', story: 'Cause it\'s rewarding funny and I feel free doing it' },
  { name: 'Pablo Fernández', location: 'Spain', age: 23, homeGym: 'Tokyo wall', instagram: '@pvbloo_', email: 'pvblofernandez@gmail.com', story: 'Something beautiful is a sport where I can challenge myself' },
  { name: 'Caroline Schnabel', location: 'LDN, VIE, NYC', age: 36, homeGym: 'Barry\'s, Alo studios', instagram: '@caro_schnabel', email: 'caroline.schnabel@gmx.net', story: 'Be present, live the moment' },
  { name: 'Andrew Hsu', location: 'Brooklyn, NY', age: 30, homeGym: 'vital', instagram: 'choochoosendtrain', email: 'andrewhsu8@gmail.com', story: 'i love it' },
  { name: 'Alec Luu', location: 'Brooklyn, NY', age: 28, homeGym: 'Vital LES', instagram: 'alec.luu', email: 'hey@alecluu.com', story: 'Climbing to me is about body and wellness' },
  { name: 'Adrien Joseph', location: 'NYC, NY', age: 22, homeGym: 'Vital LES', instagram: 'Adriienjoseph', email: 'Adrienjoseph810@gmail.com', story: 'Each route is like a little puzzle' },
  { name: 'Florian Guyénet', location: 'Paris', age: 25, homeGym: 'Arkose', instagram: 'https://www.instagram.com/ralflorian', email: 'florianguyenet@gmail.com', story: 'I climb to work on my body with fun' },
  { name: 'Ryan Cordovez', location: 'New York, Queens', age: 19, homeGym: 'Movement Gowanus', instagram: '@monkeyinreallife', email: 'nyar31159@gmail.com', story: 'I climb to push myself further physically and mentally' },
  { name: 'Kem Solid', location: 'Manhattan, NY', age: 35, homeGym: 'New York fitness', instagram: 'https://www.instagram.com/kem_solid', email: 'Kpolydore@yahoo.com', story: 'I started climbing to help my performance' },
  { name: 'Steve Lysak', location: 'Jersey City NJ', age: 26, homeGym: 'movement gowanus', instagram: 'https://www.instagram.com/stephen__lysak/', email: 'stephen.lysak@gmail.com', story: 'Climbing\'s given me such a sense of community' },
  { name: 'Christof Inderbitzin', location: 'New York City', age: 23, homeGym: 'CRG', instagram: '@christof.inder', email: 'Christof.inderbitzin@gmail.com', story: 'I climb for many reasons' },
  { name: 'Elias John Cabrera', location: 'Brooklyn, NY', age: 23, homeGym: 'Vital BK', instagram: 'https://www.instagram.com/blissedpunk', email: 'cabreraelias0121@gmail.com', story: 'Climbing for me is nurturing my spirit' },
  { name: 'tallen gabriel', location: 'brooklyn, ny', age: 30, homeGym: 'movement gowanus', instagram: '@captaintallen', email: 'tallie.gabriel@gmail.com', story: 'the community and sense of accomplishment' },
  { name: 'Dumarys Espaillat', location: 'New York City, NY', age: 33, homeGym: 'Brooklyn Boulders Queensbridge', instagram: 'www.instagram.com/msmoonlightarts', email: 'd.espaillat8821@icloud.com', story: 'I love the problem solving aspect' },
  { name: 'Satoshi Oyanagi', location: 'New York City', age: 55, homeGym: 'Cliff and Vital BK', instagram: '@prefabworks', email: 'Yoshie.s.j@gmail.com', story: 'Meditation!' },
  { name: 'Zainab Rehman', location: 'Brooklyn NY', age: 27, homeGym: 'Vital BK', instagram: '@_helloitsz_', email: 'znb.rehman68@gmail.com', story: 'I climb to overcome my fear of heights' },
  { name: 'HC SOHN', location: 'BROOKLYN', age: 40, homeGym: 'Movement LIC', instagram: 'https://www.instagram.com/hc.sohn/', email: 'Hanchang.Sohn@gmail.com', story: 'I found climbing unintentionally' },
  { name: 'Sofya Bazhanova', location: 'Lima, Peru', age: 28, homeGym: 'Pirqa, Bloque', instagram: '@bsofyko', email: 'sofya0111@gmail.com', story: 'It\'s the best way to balance my mental health' },
  { name: 'Jessica Navarrette', location: 'Brooklyn, NY', age: 26, homeGym: 'Movement Gowanus', instagram: '@jesssickaaaa', email: 'jessicanavarrette16@gmail.com', story: 'I climb because it makes me feel alive!' },
  { name: 'Katia cadavid', location: 'New York', age: 21, homeGym: 'Harlem vital', instagram: 'https://www.instagram.com/cadavidkiki', email: 'Kilicamu0323@gmail.com', story: 'As an ex-gymnast it was hard to get back into gymnastics' },
  { name: 'Jes Vesconte', location: 'New York, NY', age: 28, homeGym: 'LA Boulders / Central Rock Gym / GP-81', instagram: 'Jes.vesconte', email: 'Jes.vesconte@gmail.com', story: 'Why do I climb? I came to climbing from a Parkour background' },
  { name: 'Dallas Wade', location: 'Las Vegas', age: 32, homeGym: 'Red Rock climbing', instagram: 'Instagram.com/DallasWade_', email: 'Flashmanwade@gmail.com', story: 'I climb because it\'s so freeing' },
  { name: 'Lauraine Laino', location: 'Farmingville, NY', age: 25, homeGym: 'Island Rock', instagram: '@laurainelaino', email: 'Lauriel1209@gmail.com', story: 'Being at a regular gym feels so isolating' },
  { name: 'Alyssa Vu', location: 'New York, New York', age: 23, homeGym: 'Vital LES', instagram: '@alysssavu', email: 'alyssavu01@gmail.com', story: 'I climb because it is a form of exercise that appeals to me' },
  { name: 'Natasha Greendyk', location: 'Brooklyn, NY', age: 32, homeGym: 'Movement Gowanus', instagram: 'https://www.instagram.com/natashagreendyk/', email: 'Greendyknv@gmail.com', story: 'Rock climbing has reconnected me with a part of myself' },
  { name: 'Chris Fleischman', location: 'Westfield, NJ', age: 53, homeGym: 'Gravity Vault, Chatham', instagram: 'Chris_Fleischman', email: 'Chris.fleischman@gmail.com', story: 'So many reasons. It is a metaphor for life' },
  { name: 'Michelle Guance', location: 'Bronx, NY', age: 29, homeGym: 'Movement', instagram: '@mchllllle_', email: 'Michelleguance@gmail.com', story: 'I climb because it keeps me present' },
  { name: 'Gavin Keller', location: 'New York', age: 20, homeGym: 'Vital-not a member', instagram: 'Yogabagavin', email: 'Gavinkeller04@gmail.com', story: 'I honestly found it on kind of a whim' },
  { name: 'Michelle', location: 'Brooklyn, NY', age: 40, homeGym: 'Movement gowanus', instagram: 'https://www.instagram.com/michellefigs/', email: 'Michellefigs@gmail.com', story: 'I climb because its fun' },
  { name: 'John Bubniak', location: 'NY', age: 28, homeGym: 'Crunch/Vital', instagram: '@johnbubniak', email: 'johnbubniak@gmail.com', story: 'climbing gets me out of my head' },
  { name: 'Joy Jiang', location: 'Brooklyn', age: 34, homeGym: 'Movement Gowanus', instagram: 'Instagram.com/joy.nyc', email: 'Joyjiang18@gmail.com', story: 'I started climbing 6 years ago as a way to make new friends' },
  { name: 'Mahalia Xiaoqi', location: 'Brooklyn, NY', age: 26, homeGym: 'Cliffs Gowanus', instagram: 'https://www.instagram.com/mahaliaxs', email: 'mahalia.xiaoqi@movementgyms.com', story: 'I first climbed with my oldest childhood friend' },
  { name: 'Kaci Collins Jordan', location: 'New York City, NY', age: 31, homeGym: 'Movement', instagram: 'https://www.instagram.com/kaci_sends_sometimes/', email: 'kaci.collinsjordan@gmail.com', story: 'I have been climbing for about 13 years' },
  { name: 'Katrine Kirsebom', location: 'BROOKLYN NY', age: 25, homeGym: 'Metrorock Bushwick, GOAT', instagram: 'miss__katrine__', email: 'kkirse@me.com', story: 'It\'s hard to say exactly why I climb' },
  { name: 'Katie Belloff', location: 'Brooklyn, NY', age: 31, homeGym: 'GP81', instagram: '@kthebellz', email: 'Kbelloff22@gmail.com', story: 'My climbing community is my family' },
  { name: 'Maxwell Stanley Gorraiz', location: 'Brooklyn, NY', age: 22, homeGym: 'Movement at Gowanus', instagram: 'https://www.instagram.com/maxwellgorraiz/', email: 'Maxwellgorraiz@gmail.com', story: 'I Boulder and top rope in the gyms here' },
  { name: 'Glenn D\'Avanzo', location: 'Ashland, MA', age: 59, homeGym: 'Olympus Health & Fitness', instagram: 'https://www.instagram.com/mindsetfitnut/', email: 'gd76@comcast.net', story: 'Climbing initial was just another opportunity' },
  { name: 'florencia barletta', location: 'Miami', age: 53, homeGym: 'N/a ( home gym)', instagram: '@florenciabarletta', email: 'Florenciabarletta@gmail.com', story: 'I love to do alpine climbing' },
  { name: 'Jenni Poole', location: 'New York, NY', age: 29, homeGym: 'Vital BK', instagram: '@jennipooole', email: 'Jennipoolee@gmail.com', story: 'I climb because it helps me bridge a mind body connection' },
  { name: 'Jose (Alex) Dias', location: 'Union, NJ', age: 53, homeGym: 'Crunch', instagram: 'https://www.instagram.com/alex.dias1971', email: 'alex.dias.benfica@gmail.com', story: 'There are many parallels between climbing and life' },
  { name: 'Danielle Harper', location: 'Union City, NJ', age: 39, homeGym: 'Ymca', instagram: 'https://www.instagram.com/danimharper/', email: 'Danimharper@gmail.com', story: 'I enjoy climbing' },
  { name: 'Peter Magnus Curry', location: 'New York, NY', age: 28, homeGym: 'Metro Rock / VITAL', instagram: 'N/A', email: 'peter.magnus.curry@gmail.com', story: 'Climbing is technical and requires problem solving' },
  { name: 'Elliott Wood', location: 'ATL, GA', age: null, homeGym: 'Central Rock Gym', instagram: 'https://www.instagram.com/elliottlwood/', email: 'elliottleighwood@gmail.com', story: 'Freedom, ability to overcome obstacles' },
  { name: 'Donna H. Hansen', location: 'Denver', age: 53, homeGym: 'The wild. Via Ferrata', instagram: '@donnasmojo', email: 'Donnasmojo@gmail.com', story: 'Remind myself I can still do it' },
  { name: 'Scott Bernard Nelson', location: 'Portland, Oregon', age: 53, homeGym: 'The Circuit', instagram: 'https://www.instagram.com/scottbernardnelson/', email: 'scottbernardnelson@gmail.com', story: 'I\'m in love with big-wall climbing' },
  { name: 'Debra Corley', location: 'Long Beach California', age: 66, homeGym: 'Club Studio', instagram: '@embracingturning60', email: 'tulifts@gmail.com', story: 'I started rock climbing about 10 years ago' },
  { name: 'Jonathan Chia-Ho Lee', location: 'Los Angeles, CA', age: 40, homeGym: 'Sender One', instagram: 'https://www.instagram.com/jclee_md/', email: 'jonchlee@gmail.com', story: 'It\'s a physical act that symbolizes mental processes' },
  { name: 'Sarah Melgar', location: 'New York', age: 28, homeGym: 'Movement Gowanus', instagram: 'https://www.instagram.com/sarah_melgar3/', email: 'sarah.o.melgar@gmail.com', story: 'I climb because it makes me feel strong' },
  { name: 'Destinee', location: 'New York, New York', age: 33, homeGym: 'Movement LLC', instagram: 'instagram.com/destineeryan118', email: 'destineeryan118@gmail.com', story: 'I climb because I love taking on the challenge' },
  { name: 'Alan Johnson', location: 'Dallas, Texas', age: 37, homeGym: 'Equinox', instagram: '@alanjmodeling', email: 'aejohnson@me.com', story: 'I don\'t climb often, but I love when I do' },
  { name: 'Justin Seiller', location: 'Paramus, New Jersey', age: 27, homeGym: 'Gravity Vault', instagram: 'Instagram.com/justinseiller', email: 'Justinseiller324@gmail.com', story: 'I like the substance that is within climbing' },
  { name: 'Caroline Buddendorf', location: 'Los Angeles, CA', age: 25, homeGym: 'Hollywood boulders', instagram: 'https://www.instagram.com/caroline_buddendorf/', email: 'caroline.buddendorf@gmail.com', story: 'I climb because it makes me feel present and mindful' },
  { name: 'Joshua Chen', location: 'Brooklyn, NY', age: 27, homeGym: 'Seattle Bouldering Project', instagram: 'https://www.instagram.com/illiteratejosh/', email: '1997joshuachen@gmail.com', story: 'I like the excitement that it provides' },
  { name: 'Madeline Lopez', location: 'BROOKLYN NEW YORK', age: 58, homeGym: 'Harbor Fotness', instagram: 'IG:@Madeline8497', email: 'Madelinelopez1313@gmail.com', story: 'Freedoms! Challenge' },
  { name: 'Jasmine Hsu', location: 'Brooklyn, NY', age: 35, homeGym: 'Vital BK, Vital LES', instagram: 'allezjas', email: 'jasminechsu@gmail.com', story: 'Mental health, self-confidence, and feeling strong' },
  { name: 'Theresa Vo', location: 'Garden Grove, CA', age: 25, homeGym: 'Hangar 18 Orange', instagram: '@tree.vo', email: 'Connect.Theresavo@gmail.com', story: 'Not only is climbing a means of exercise' },
  { name: 'Mason Sammarco', location: 'Milwaukee, Wisconsin', age: 21, homeGym: 'Adventure Rock Milwaukee', instagram: 'https://www.instagram.com/masonsammarco/', email: 'masonsammarco@gmail.com', story: 'I climb to push my limits' },
  { name: 'Jennifer Hessel', location: 'Chicago, Illinois', age: 23, homeGym: 'First Ascent Chicago', instagram: 'https://www.instagram.com/itsj3nnnn/', email: 'jxnnhxssxl@gmail.com', story: 'I climb as a way to move my body' },
  { name: 'Jess Tran', location: null, age: null, homeGym: null, instagram: 'https://www.instagram.com/jessglistening/', email: 'sydney@ohtheagency.com', story: null },
  { name: 'Mireille Koyounian', location: 'Vernon, CT', age: 51, homeGym: 'No', instagram: 'https://app.castingnetworks.com/talent/public-profile/576baece-a178-11ef-a1e8-a51bbfc02dc7', email: 'cosmodaisy24516@icloud.com', story: 'I don\'t, I was interested in the role' },
  { name: 'Arden Lassalle', location: 'Los Angeles', age: 29, homeGym: 'Touch stone, cliffs of Id', instagram: 'https://www.instagram.com/theardener/', email: 'ardener@gmail.com', story: 'I boulder around v5-6' },
  { name: 'Dee Schmitz', location: 'Lake Hopatcong, NJ', age: 53, homeGym: 'NJ Rock Gym', instagram: 'https://www.instagram.com/schmitzdee/', email: 'Dee@deezigns.com', story: 'It\'s my way of finding a way to climb' },
  { name: 'Chad Halbrook', location: 'Denver, CO', age: 40, homeGym: 'Movement', instagram: 'https://www.instagram.com/halbrookchad/', email: 'halbrookchad@gmail.com', story: 'I climb to challenge myself both physically and mentally' },
  { name: 'Stephanie Whigham', location: 'San Jose, CA', age: 46, homeGym: 'The Studio (Touchstone)', instagram: 'https://www.instagram.com/actslikestephanie/', email: 'stephanie@stephaniewhigham.com', story: 'I climb because it\'s fun' },
  { name: 'Xixi Wang', location: 'New York, NY', age: 24, homeGym: 'Vital West Harlem', instagram: 'instagram.com/imxixiwang', email: 'xixiw615@gmail.com', story: 'I started climbing because I wanted to feel stronger' },
  { name: 'Stephanie Mock', location: 'Brooklyn NY', age: 29, homeGym: 'Vital BK', instagram: 'stephaniemock', email: 'stephanie12365@gmail.com', story: 'I started climbing indoors earlier this year' },
  { name: 'Elsa Poppy Claassen', location: 'New York, NY', age: 20, homeGym: 'Vital BK', instagram: 'https://www.instagram.com/elsa_claa/', email: 'Epc9784@nyu.edu', story: '.' },
  { name: 'Leith Conybeare', location: 'NY', age: 25, homeGym: 'Vital les, bk', instagram: 'https://www.instagram.com/leithal_gummybears', email: 'Leithcony@gmail.com', story: 'It\'s learning to trust myself and my body' },
  { name: 'Sarah Seaton-Todd', location: 'New York, New York', age: 32, homeGym: 'Vital LES', instagram: 'Not on Instagram', email: 'Sarahseatontodd@gmail.com', story: 'In the midst of healing from a heartbreak' },
  { name: 'Layla Top', location: 'Manhattan', age: 26, homeGym: 'N/a', instagram: 'https://www.instagram.com/ggirle_', email: 'Shmeworld@gmail.com', story: 'I luv it' },
  { name: 'Jodi Csaszar Zielinski', location: 'NJ', age: 50, homeGym: 'NJ Rock gym', instagram: 'Njrockgym', email: 'jodi.zielinski@gmail.com', story: 'Community' },
  { name: 'Maria Hindi', location: 'Corvallis, Oregon', age: 20, homeGym: 'Valley Rock Gym', instagram: 'https://www.instagram.com/marhico2/', email: 'hindim243@gmail.com', story: 'I was introduced to climbing through an old friend' },
  { name: 'Warren Watson', location: 'New York, NY', age: 55, homeGym: 'Movement', instagram: 'https://www.instagram.com/warrenwatsonactor', email: 'warren@warrenwatson.net', story: 'It challenges you mentally as well as physically' },
  { name: 'Deyon McFadden', location: 'Philadelphia, PA', age: 24, homeGym: 'Planet Fitness and N.Y Fitness', instagram: 'https://www.instagram.com/dey_mcfadden/', email: 'deyontalent@gmail.com', story: 'Today, I climb to stay in good health' },
  { name: 'Paulina Aguilera', location: 'Hollywood, FL', age: 40, homeGym: 'Project Rock', instagram: '@pnutparty', email: 'itspaulinaaguilera@gmail.com', story: 'Initially, I started climbing as a way to manage my fear' },
  { name: 'Sophia Helmkamp', location: 'NYC', age: 26, homeGym: 'Metrorock Bushwick', instagram: '@sophelmkamp', email: 'Soph.outside@gmail.com', story: 'I first started climbing as a way to be active' },
  { name: 'Jaron Shane Simler', location: 'Gig Harbor, Washington', age: 18, homeGym: 'Edgeworks Climbing Gym', instagram: '@official_jnugg', email: 'kristalynsimler@gmail.com', story: 'I climb for the beautiful views' },
  { name: 'Molly Sievert', location: 'Los Angeles, CA', age: 35, homeGym: 'Not a member', instagram: 'instagram.com/molly_sv', email: 'mollysievert@gmail.com', story: 'Climbing is a way to see the world' },
  { name: 'Isaac Rosenblum', location: 'Suffern NY', age: 42, homeGym: 'Gravity vault', instagram: 'https://www.instagram.com/thenydermdude/', email: 'isaacrosenblum2011@gmail.com', story: 'I took up climbing primarily to confront my lifelong fear' },
  { name: 'Seth Graham', location: 'Chandler', age: 39, homeGym: 'LA Fitness', instagram: 'https://www.instagram.com/sdg17_/', email: 'Nevergiveup17@msn.com', story: 'I climb because I feel it\'s kind of low impact' },
  { name: 'Lorenz Mager', location: 'Brooklyn, NY', age: 31, homeGym: 'vital bk', instagram: 'lorenzolivermager', email: 'lmager93@aol.com', story: 'community found on an equal footing' },
  { name: 'Amy Zubieta', location: 'New York, NY', age: 28, homeGym: 'Central Rock Gym', instagram: 'https://instagram.com/amy.zubieta', email: 'amy.zubieta@gmail.com', story: 'I love the challenge of climbing' },
  { name: 'khadijah muhammad', location: 'atco, nj', age: 22, homeGym: 'edge fitness', instagram: 'https://www.instagram.com/dij.xo/', email: 'valenciamason23@gmail.com', story: 'Climbing to me means, climbing to become greater' },
  { name: 'Michael Mendoza', location: 'NYC', age: 20, homeGym: 'Central Rock Gym', instagram: 'https://www.instagram.com/mtm_m1k3/', email: 'mendozamichael643@gmail.com', story: 'i climb because it\'s a way of escaping' },
  { name: 'Poittevin juline', location: 'Manathan', age: 21, homeGym: 'No', instagram: 'Julineptv', email: 'Poittevinjuline@gmail.com', story: 'Yes i am a climber' },
  { name: 'Elvie Mae Parian', location: 'Ridgewood, NY', age: 31, homeGym: 'Metro Rock Bushwick', instagram: 'https://www.instagram.com/flightlessbutstillwriting', email: 'icerone100@gmail.com', story: 'I was inspired by seeing friends' },
  { name: 'Kzarina Leonardo', location: 'Brooklyn, NY', age: 27, homeGym: 'Metro Rock, Movement, Vital, GP', instagram: 'https://www.instagram.com/_kzarina_', email: 'kzarina.luna@gmail.com', story: 'Community. Self-love. Self-growth.' },
  { name: 'Austin Yoo', location: 'Long Island City, NY', age: 30, homeGym: 'Vital BK', instagram: 'https://www.instagram.com/achyooo', email: 'austin.hl.yoo@gmail.com', story: null },
  { name: 'Eu Jin Lee', location: 'Brooklyn, NY', age: 29, homeGym: 'GP81', instagram: '@ejlee', email: 'one9ninety5@gmail.com', story: 'I actually don\'t anymore since I\'ve moved' },
  { name: 'Peter Sanderson', location: 'Brooklyn, NYC', age: 27, homeGym: 'Vital BK', instagram: 'Sandersonpaak', email: 'petersanderson97@gmail.com', story: 'I started climbing seriously as a way to move and grow' },
  { name: 'Angheli Samaniego Moya', location: 'Jackson Heights, NY', age: 21, homeGym: 'home gym', instagram: 'aanghelii', email: 'anghelichristine@gmail.com', story: 'Since I\'m in the city I don\'t really climb' },
  { name: 'Matthew Calayo', location: 'Brooklyn, NY', age: 27, homeGym: 'Vital BK', instagram: 'mattcalayo', email: 'matthewcalayo@gmail.com', story: 'I climb for the physical and mental exercise' },
  { name: 'Tetsu zhao', location: 'Nyc', age: 29, homeGym: 'N/a (setter at crg)', instagram: 'Kevin.tetsu', email: 'kzhao517@gmail.com', story: 'It was a just hobby and now it\'s my job' },
  { name: 'Elina Arulraj', location: 'New York', age: 48, homeGym: 'Central rock gym chelsea', instagram: 'Lini515', email: 'lini515@gmail.com', story: 'Started young and it gave me confidence' },
  { name: 'Morgan Li', location: 'New York, NY', age: 36, homeGym: 'Central Rock Gym', instagram: 'Morganlinyc', email: 'rueroyale@gmail.com', story: 'I climb to push my limits' },
  { name: 'Sally Michael', location: 'NYC, New York', age: 16, homeGym: 'Central Rock Gym, Chelsea', instagram: 'sal_mich13', email: 'sallymmichael@gmail.com', story: 'I climb because it helps me escape the stress' },
  { name: 'Yihong Chen', location: 'New York, NY', age: 32, homeGym: 'Life Time', instagram: 'https://www.instagram.com/smileyihong/', email: 'yihongchen0818@gmail.com', story: 'For me climbing is like an adventure' },
  { name: 'Josiah Arment', location: 'Denver CO', age: 24, homeGym: 'Planet Fitness', instagram: 'https://www.instagram.com/josiaharment/', email: 'armentjosiah@gmail.com', story: 'I love to rock climb' },
  { name: 'Heena Salwan', location: 'Livingston,New Jersey', age: 33, homeGym: 'appartment gym', instagram: 'https://www.instagram.com/fitglam31', email: 'Heenasalwan@gmail.com', story: 'I climb because to make my body flexible' },
  { name: 'Eyal Alfandary', location: 'Los Angeles', age: 24, homeGym: 'LA Fitness', instagram: 'https://www.instagram.com/p/DVAHlK9Dw95/', email: 'eyal.alfandary@gmail.com', story: 'I love doing it because it makes me feel free' },
  { name: 'Gabriel Barillas', location: 'LA', age: 38, homeGym: 'N/A', instagram: 'https://www.instagram.com/gebarillas/', email: 'barillasgabe@gmail.com', story: 'I like hiking, and climbing the rocks' },
];

async function importAll() {
  console.log(`Checking ${allClimerStories.length} climber story entries...\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const climber of allClimerStories) {
    try {
      const nameParts = climber.name.split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if exists
      const { data: existing } = await supabase
        .from('models')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      // Clean Instagram
      const ig = climber.instagram
        ? climber.instagram
            .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '')
            .replace(/^@+/, '')
            .replace(/\?.*/, '')
            .replace(/\/$/, '')
            .trim()
        : null;

      const { error } = await supabase
        .from('models')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: climber.email || null,
          instagram_handle: ig || null,
          based_in: climber.location || null,
          notes: climber.story || null,
          reviewed: false,
          source: 'climber_stories_import',
        });

      if (error) {
        console.error(`✗ ${climber.name}:`, error.message);
        errors++;
      } else {
        imported++;
      }
    } catch (err) {
      console.error(`✗ ${climber.name}:`, err.message);
      errors++;
    }
  }

  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`✓ Imported: ${imported} new entries`);
  console.log(`⊘ Skipped (already exists): ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`📊 Total climber stories: ${71 + imported}`);
}

importAll().catch(console.error);
