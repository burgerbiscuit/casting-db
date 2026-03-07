const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

// Climber data WITH STORIES (from CSV)
const climberData = [
  {name: "Felix Wong", location: "New York City", age: 38, story: "I love the climbing community", instagram: "https://www.instagram.com/felinewong/", email: "felixwongphoto@gmail.com"},
  {name: "Sami Mekonen", location: "Los Angeles, California", age: 26, story: "I like climbing 'cause it's a stress reliever, and it helps me calm down. It's also a great way to build my shoulder and forearm muscles.", instagram: "https://www.instagram.com/samimekonen_/", email: "samiamekonen@gmail.com"},
  {name: "Koraya Fay", location: "Gilbert, Arizona", age: 19, story: "The moment I started rock climbing I felt free! I instantly fell in love with the happiness and clarity that it brought me. I started at Alta, then about 1 week in I met some really great friends that invited me to climb outdoors. I feel so connected to the earth.", instagram: "https://www.instagram.com/korayafay", email: "Korayafay@gmail.com"},
  {name: "Christa Guzmán", location: "Brooklyn, NY", age: 24, story: "When I was 14 years old, my older sister got a job at the local rock climbing gym in our town. This meant I could climb for free! As a young Latina girl with ADHD in a predominantly white town, I felt like I didn't fit in or relate to any of the other girls. This was a hobby that made me feel welcomed and safe.", instagram: "https://www.instagram.com/christa.guz/", email: "christaguzman01@gmail.com"},
  {name: "Szohaib Khan", location: "New York, New York", age: 21, story: "I miss climbing trees. And climbing rocks in Central Park. Being a kid made doing these silly little things so much easier and less judged. So rock climbing allows me to have fun with my friends while also getting stronger and staying in shape.", instagram: "https://www.instagram.com/szohaib_khan/", email: "szkhan914@gmail.com"},
  {name: "Lindsey Martin", location: "Queens, NY", age: 22, story: "I mainly enjoy climbing for the sense of achievement and community aspect. You can only get better by doing it more. It makes me feel so strong and has changed my perspective on fitness and health.", instagram: "https://instagram.com/_lindseymartin_", email: "linmartin1020@gmail.com"},
  {name: "Christopher De Leon", location: "Flushing, New York", age: 33, story: "Fun social group activity", instagram: "Kr1z", email: "Chrisdeleon91@gmail.com"},
  {name: "Johnatan Tamayo Penilla", location: "Hoboken, NJ", age: 21, story: "The reason why I climb is because it has had a positive impact on my mental health since the day I started. Climbing has helped me with many aspects of my life and continues to do so.", instagram: "https://www.instagram.com/johnatan_tam/", email: "Jtamayopenilla@gmail.com"},
  {name: "Katherine Nunez", location: "Peabody, MA", age: 38, story: "To move through my grief - recently widowed. Because I can do hard things. To conquer my own fears.", instagram: "https://www.instagram.com/kathycnunez/", email: "Katherine.chum@yahoo.com"},
  {name: "Rosie Ramassamy", location: "Paris, France", age: 26, story: "I love sport with sensation like climbing, tree climbing, trekking, skydiving", instagram: "_rxrosie", email: "Rosie.gabriella@live.fr"},
  {name: "Victoria bell", location: "West Jordan, ut", age: 38, story: "To fully expand my horizons and push my limits. I love to celebrate what my body can still achieve.", instagram: "https://www.instagram.com/victoriabell.jpg/", email: "Vsbell33@gmail.com"},
  {name: "Remy Yin", location: "New York City, New York", age: 23, story: "It's the most rewarding sport and incredibly fun and stimulating. I love the progress, thrill, and work out as it works every part of your body.", instagram: "https://www.instagram.com/remyyin2nd/", email: "remy.yin@gmail.com"},
  {name: "Ayanleh Elmi Barreh", location: "Paris", age: 24, story: "Cause it's rewarding funny and I feel free doing it", instagram: "https://www.instagram.com/hedi_skinnyman/", email: "ayanleh.elmibarreh@gmail.com"},
  {name: "Pablo Fernández", location: "Spain", age: 23, story: "Something beautiful is a sport where I can challenge myself and grow every single day.", instagram: "@pvbloo_", email: "pvblofernandez@gmail.com"},
  {name: "Caroline Schnabel", location: "LDN, VIE, NYC", age: 36, story: "Be present, live the moment as well as the mental physical component of that sport", instagram: "@caro_schnabel", email: "caroline.schnabel@gmx.net"},
  {name: "Andrew Hsu", location: "Brooklyn, NY", age: 30, story: "i love it. i love the community. i love moving my body. i love challenging myself. i love being outdoors", instagram: "choochoosendtrain", email: "andrewhsu8@gmail.com"},
  {name: "Alec Luu", location: "Brooklyn, NY", age: 28, story: "Initially, I started climbing to rekindle a friendship. Now I realize climbing is about connection and building community.", instagram: "alec.luu", email: "hey@alecluu.com"},
  {name: "Adrien Joseph", location: "NYC, NY", age: 22, story: "Climbing to me is not only my favorite way to exercise, but also a way to challenge myself mentally and physically. Each route is like a little puzzle.", instagram: "Adriienjoseph", email: "Adrienjoseph810@gmail.com"},
  {name: "Florian Guyénet", location: "Paris", age: 25, story: "I climb to work on my body with fun, to challenge myself, to feel more strong and agile. Climbing make me feel free and in peace in my head.", instagram: "https://www.instagram.com/ralflorian", email: "florianguyenet@gmail.com"},
  {name: "Ryan Cordovez", location: "New York, Queens", age: 19, story: "I climb to push myself further physically and mentally. Climbing is courage for lack of a better word.", instagram: "@monkeyinreallife", email: "nyar31159@gmail.com"},
  {name: "Kem Solid", location: "Manhattan, NY", age: 35, story: "I started climbing to help my performance during Spartan races. Now I do it because I love the thrill of placing my palm on the next placement.", instagram: "https://www.instagram.com/kem_solid", email: "Kpolydore@yahoo.com"},
  {name: "Steve Lysak", location: "Jersey City, NJ", age: 26, story: "Climbing's given me such a sense of community. As a gay man, traditional sports didn't always feel accepting or comfortable.", instagram: "https://www.instagram.com/stephen__lysak/", email: "stephen.lysak@gmail.com"},
  {name: "Christof Inderbitzin", location: "New York City", age: 23, story: "I climb for many reasons: fun and community, the joy of the process of getting better, and it saved me from unhealthy habits.", instagram: "@christof.inder", email: "Christof.inderbitzin@gmail.com"},
  {name: "Elias John Cabrera", location: "Brooklyn, NY", age: 23, story: "Climbing for me is nurturing my spirit. Connecting with my inner-child. It keeps me feeling strong, playful, and free.", instagram: "https://www.instagram.com/blissedpunk", email: "cabreraelias0121@gmail.com"},
  {name: "tallen gabriel", location: "brooklyn, ny", age: 30, story: "the community and sense of accomplishment + facing failure - gifts i will carry throughout my whole life (i work in the climbing industry as an instructor!)", instagram: "@captaintallen", email: "tallie.gabriel@gmail.com"},
  {name: "Dumarys Espaillat", location: "New York City, NY", age: 33, story: "I started climbing recently and find it very interesting. I love the problem solving aspect of it and the progress.", instagram: "www.instagram.com/msmoonlightarts", email: "d.espaillat8821@icloud.com"},
  {name: "Satoshi Oyanagi", location: "New York City", age: 55, story: "Meditation!", instagram: "@prefabworks", email: "Yoshie.s.j@gmail.com"},
  {name: "Zainab Rehman", location: "Brooklyn, NY", age: 27, story: "I climb to overcome my fear of heights and to challenge myself physically and mentally. I also enjoy the social aspect.", instagram: "@_helloitsz_", email: "znb.rehman68@gmail.com"},
  {name: "HC SOHN", location: "BROOKLYN", age: 40, story: "I found climbing unintentionally - went to a Groupon class with my cousin and was surprised by how much I enjoyed it.", instagram: "https://www.instagram.com/hc.sohn/", email: "Hanchang.Sohn@gmail.com"},
  {name: "Sofya Bazhanova", location: "Lima, Peru", age: 28, story: "It's the best way to balance my mental health, get used to trying and failing, getting comfortable with being uncomfortable", instagram: "@bsofyko", email: "sofya0111@gmail.com"},
  {name: "Jessica Navarrette", location: "Brooklyn, NY", age: 26, story: "I climb because it makes me feel alive! It challenges me, makes me feel close to nature, and it's good for my mental health.", instagram: "@jesssickaaaa", email: "jessicanavarrette16@gmail.com"},
  {name: "Katia cadavid", location: "New York", age: 21, story: "As an ex-gymnast it was hard to get back into gymnastics as an adult. Climbing was like muscle memory. Gives me something to be excited for.", instagram: "https://www.instagram.com/cadavidkiki", email: "Kilicamu0323@gmail.com"},
  {name: "Jes Vesconte", location: "New York, NY", age: 28, story: "I came to climbing from a Parkour background. Climbing allows me to be strong and adaptive, so I can be a useful member of my community.", instagram: "Jes.vesconte", email: "Jes.vesconte@gmail.com"},
  {name: "Dallas Wade", location: "Las Vegas", age: 32, story: "I climb because it's so freeing and so demanding of so many parts of you. It's not about just being strong or smart, there are many ways to climb.", instagram: "Instagram.com/DallasWade_", email: "Flashmanwade@gmail.com"},
  {name: "Lauraine Laino", location: "Farmingville, NY", age: 25, story: "Being at a regular gym feels so isolating. Climbing builds community and trust. The people are the nicest human beings ever.", instagram: "@laurainelaino", email: "Lauriel1209@gmail.com"},
  {name: "Alyssa Vu", location: "New York, New York", age: 23, story: "I climb because it is a form of exercise that makes me feel accomplished. Other forms felt mundane, but climbing is rewarding.", instagram: "@alysssavu", email: "alyssavu01@gmail.com"},
  {name: "Natasha Greendyk", location: "Brooklyn, NY", age: 32, story: "Rock climbing has reconnected me with a part of myself I didn't realize I'd lost. It gave me permission to step away from the noise and find balance.", instagram: "https://www.instagram.com/natashagreendyk/", email: "Greendyknv@gmail.com"},
  {name: "Chris Fleischman", location: "Westfield, NJ", age: 53, story: "So many reasons. It is a metaphor for life in that we need to directly confront and overcome our fears. It presents many mental, emotional and physical challenges.", instagram: "Chris_Fleischman", email: "Chris.fleischman@gmail.com"},
  {name: "Michelle Guance", location: "Bronx, NY", age: 29, story: "I climb because it keeps me present, it helps me feel strong and helps me connect with my inner child.", instagram: "@mchllllle_", email: "Michelleguance@gmail.com"},
  {name: "Gavin Keller", location: "New York", age: 20, story: "I honestly found it on kind of a whim. My friends started climbing and I was reluctant but began to love it.", instagram: "Yogabagavin", email: "Gavinkeller04@gmail.com"},
  {name: "Michelle", location: "Brooklyn, NY", age: 40, story: "I climb because its fun. It conditions my body. It keeps my muscles and bones healthy.", instagram: "https://www.instagram.com/michellefigs/", email: "Michellefigs@gmail.com"},
  {name: "John Bubniak", location: "NY", age: 28, story: "climbing gets me out of my head and into my body and ignites a primal instinct inside me that balances out my mental health.", instagram: "@johnbubniak", email: "johnbubniak@gmail.com"},
  {name: "Joy Jiang", location: "Brooklyn", age: 34, story: "I started climbing 6 years ago as a way to make new friends after a break up. It was easy to measure my progress using the climbing grade system.", instagram: "Instagram.com/joy.nyc", email: "Joyjiang18@gmail.com"},
  {name: "Mahalia Xiaoqi", location: "Brooklyn, NY", age: 26, story: "I first climbed with my oldest childhood friend from our adoption group. Later, climbing became a newfound comfort during the depths of winter in Germany.", instagram: "https://www.instagram.com/mahaliaxs", email: "mahalia.xiaoqi@movementgyms.com"},
  {name: "Kaci Collins Jordan", location: "New York City, NY", age: 31, story: "I have been climbing for about 13 years, and at this point it is part of who I am. It is the thing that first allowed me to really connect with my body.", instagram: "https://www.instagram.com/kaci_sends_sometimes/", email: "kaci.collinsjordan@gmail.com"},
  {name: "Katrine Kirsebom", location: "BROOKLYN, NY", age: 25, story: "It's hard to say exactly why I climb, because there are so many pieces to it. I love the sense of community and all of the friends I've found through it.", instagram: "miss__katrine__", email: "kkirse@me.com"},
  {name: "Katie Belloff", location: "Brooklyn, NY", age: 31, story: "My climbing community is my family. Climbing to me is about fitness and strength, but also about connection and community.", instagram: "@kthebellz", email: "Kbelloff22@gmail.com"},
  {name: "Maxwell Stanley Gorraiz", location: "Brooklyn, NY", age: 22, story: "I Boulder and top rope in the gyms. I grew up scaling cliffs in Telluride, Colorado. I've had the urge to climb my entire life.", instagram: "https://www.instagram.com/maxwellgorraiz/", email: "Maxwellgorraiz@gmail.com"},
  {name: "Glenn D'Avanzo", location: "Ashland, MA", age: 59, story: "Climbing initially was just another opportunity to be physical and quickly became a passion to connect the mind and body.", instagram: "https://www.instagram.com/mindsetfitnut/", email: "gd76@comcast.net"},
  {name: "florencia barletta", location: "Miami", age: 53, story: "I love to do alpine climbing. To me it means freedom and pushing limits while enjoying some of the most peaceful or hard conditions.", instagram: "@florenciabarletta", email: "Florenciabarletta@gmail.com"},
  {name: "Jenni Poole", location: "New York, NY", age: 29, story: "I climb because it helps me bridge a mind body connection that allows me to be fully present in the current moment.", instagram: "@jennipooole", email: "Jennipoolee@gmail.com"},
  {name: "Jose (Alex) Dias", location: "Union, NJ", age: 53, story: "There are many parallels between climbing and life. Both are filled with obstacles and it's up to you to decide how to overcome them.", instagram: "https://www.instagram.com/alex.dias1971", email: "alex.dias.benfica@gmail.com"},
  {name: "Danielle Harper", location: "Union City, NJ", age: 39, story: "I enjoy climbing, but only advanced beginner", instagram: "https://www.instagram.com/danimharper/", email: "Danimharper@gmail.com"},
  {name: "Peter Magnus Curry", location: "New York, NY", age: 28, story: "Climbing is technical and requires problem solving through balance and strength from otherwise untested muscles. It's also social.", instagram: "N/A", email: "peter.magnus.curry@gmail.com"},
  {name: "Elliott Wood", location: "ATL, GA", age: 27, story: "Freedom, ability to overcome obstacles. Strength.", instagram: "https://www.instagram.com/elliottlwood/", email: "elliottleighwood@gmail.com"},
  {name: "Donna H. Hansen", location: "Denver", age: 53, story: "Remind myself I can still do it and encourage others to challenge themselves.", instagram: "@donnasmojo", email: "Donnasmojo@gmail.com"},
  {name: "Scott Bernard Nelson", location: "Portland, Oregon", age: 53, story: "I'm in love with big-wall climbing. The world just looks different up there, once you're a few pitches above the deck.", instagram: "https://www.instagram.com/scottbernardnelson/", email: "scottbernardnelson@gmail.com"},
  {name: "Debra Corley", location: "Long Beach, California", age: 66, story: "I started rock climbing about 10 years ago after my divorce. It was the most comforting thing I had found.", instagram: "@embracingturning60", email: "tulifts@gmail.com"},
  {name: "Jonathan Chia-Ho Lee", location: "Los Angeles, CA", age: 40, story: "It's a physical act that symbolizes mental processes of growth, stretching, and evolving.", instagram: "https://www.instagram.com/jclee_md/", email: "jonchlee@gmail.com"},
  {name: "Sarah Melgar", location: "New York", age: 28, story: "I climb because it makes me feel strong and as a female that is something that I really value.", instagram: "https://www.instagram.com/sarah_melgar3/", email: "sarah.o.melgar@gmail.com"},
  {name: "Destinee", location: "New York, New York", age: 33, story: "I climb because I love taking on the challenge of a difficult course and the sense of accomplishment I feel when I reach the top!", instagram: "instagram.com/destineeryan118", email: "destineeryan118@gmail.com"},
  {name: "Alan Johnson", location: "Dallas, Texas", age: 37, story: "I don't climb often, but I love when I do. It's a great workout, and it challenges me much more than a regular workout.", instagram: "@alanjmodeling", email: "aejohnson@me.com"},
  {name: "Justin Seiller", location: "Paramus, New Jersey", age: 27, story: "I like the substance that is within climbing, the planning, the routing, the challenge and the overall idea of having a project.", instagram: "Instagram.com/justinseiller", email: "Justinseiller324@gmail.com"},
  {name: "Caroline Buddendorf", location: "Los Angeles, CA", age: 25, story: "I climb because it makes me feel present and mindful. It's the only type of exercise that has engaged my brain and felt fun.", instagram: "https://www.instagram.com/caroline_buddendorf/", email: "caroline.buddendorf@gmail.com"},
  {name: "Joshua Chen", location: "Brooklyn, NY", age: 27, story: "I like the excitement that it provides. Before I started climbing, I was terrified of heights. I went once and was instantly hooked.", instagram: "https://www.instagram.com/illiteratejosh/", email: "1997joshuachen@gmail.com"},
  {name: "Madeline Lopez", location: "BROOKLYN, NEW YORK", age: 58, story: "Freedoms! Challenge", instagram: "IG:@Madeline8497", email: "Madelinelopez1313@gmail.com"},
  {name: "Jasmine Hsu", location: "Brooklyn, NY", age: 35, story: "Mental health, self-confidence, and feeling strong for the first time in my life.", instagram: "allezjas", email: "jasminechsu@gmail.com"},
  {name: "Theresa Vo", location: "Garden Grove, CA", age: 25, story: "Not only is climbing a means of exercise for me, it inspires me to achieve more in life with the meaningful connections I've made.", instagram: "@tree.vo", email: "Connect.Theresavo@gmail.com"},
  {name: "Mason Sammarco", location: "Milwaukee, Wisconsin", age: 21, story: "I climb to push my limits. As a perfectionist, have the opportunity to fail and try again is hard, but so needed.", instagram: "https://www.instagram.com/masonsammarco/", email: "masonsammarco@gmail.com"},
  {name: "Jennifer Hessel", location: "Chicago, Illinois", age: 23, story: "I climb as a way to move my body in a way that also stimulates my mind. It makes me feel strong in a unique way.", instagram: "https://www.instagram.com/itsj3nnnn/", email: "jxnnhxssxl@gmail.com"},
  {name: "Mireille Koyounian", location: "Vernon, CT", age: 51, story: "I don't, I was interested in the role", instagram: "https://app.castingnetworks.com/talent/public-profile/576baece-a178-11ef-a1e8-a51bbfc02dc7", email: "cosmodaisy24516@icloud.com"},
  {name: "Arden Lassalle", location: "Los Angeles", age: 29, story: "I boulder around v5-6 and I lead in the high 11s. I love getting stronger and challenging myself when i'm at my limit.", instagram: "https://www.instagram.com/theardener/", email: "ardener@gmail.com"},
  {name: "Dee Schmitz", location: "Lake Hopatcong, NJ", age: 53, story: "It's my way of finding a way to climb my own way around some permanent injuries. It's definitely a mental challenge getting over my fears of heights.", instagram: "https://www.instagram.com/schmitzdee/", email: "Dee@deezigns.com"},
  {name: "Chad Halbrook", location: "Denver, CO", age: 40, story: "I climb to challenge myself both physically and mentally, and to connect with others who have a passion for climbing.", instagram: "https://www.instagram.com/halbrookchad/", email: "halbrookchad@gmail.com"},
  {name: "Stephanie Whigham", location: "San Jose, CA", age: 46, story: "I climb because it's fun, it makes me feel strong and helps me stay fit. I love the way it's mental as well as physical.", instagram: "https://www.instagram.com/actslikestephanie/", email: "stephanie@stephaniewhigham.com"},
  {name: "Xixi Wang", location: "New York, NY", age: 24, story: "I started climbing because I wanted to feel stronger. Now, I climb to feel connected to the community and it's also benefited my mental health.", instagram: "instagram.com/imxixiwang", email: "xixiw615@gmail.com"},
  {name: "Stephanie Mock", location: "Brooklyn, NY", age: 29, story: "I started climbing indoors and quickly fell in love with the sport.", instagram: "stephaniemock", email: "stephanie12365@gmail.com"},
];

(async () => {
  try {
    console.log(`\n📝 UPDATING ${climberData.length} CLIMBERS WITH STORIES\n`);

    for (const climber of climberData) {
      const { data: model } = await supabase
        .from('models')
        .select('id')
        .eq('source', 'climbers-tender-moments')
        .ilike('first_name', climber.name.split(' ')[0])
        .limit(1)
        .maybeSingle();

      if (model && climber.story) {
        await supabase
          .from('models')
          .update({
            notes: climber.story,
            instagram_handle: climber.instagram,
          })
          .eq('id', model.id);
      }
    }

    console.log(`✅ UPDATED ${climberData.length} climbers with stories\n`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
