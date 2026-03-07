const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://yayrsksrgrsjxcewwwlg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheXJza3NyZ3JzanhjZXd3d2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQwMDM2NywiZXhwIjoyMDg3OTc2MzY3fQ.STPwiCwbZyJ_65omEITK0SGtT6z-JtMcgN6eDmyJUEo'
);

// Paste CSV data
const csvData = `Felix Wong,New York City,38,https://www.instagram.com/felinewong/,felixwongphoto@gmail.com,I love the climbing community,https://drive.google.com/open?id=1cZIsFVUT7isxJ0-ylkIVZ83i9Wfo0q0G
Sami Mekonen,Los Angeles California,26,https://www.instagram.com/samimekonen_/,samiamekonen@gmail.com,I like climbing 'cause it's a stress reliever,https://drive.google.com/open?id=1usjQ3wUOlhnOr0sLbR8uW2Vg875BiZTj
Koraya Fay,Gilbert Arizona,19,https://www.instagram.com/korayafay?igsh=MWs3ODJ2Y2JsbWE0NQ%3D%3D&utm_source=qr,Korayafay@gmail.com,The moment I started rock climbing I felt free!,https://drive.google.com/open?id=10kIUh-ktYcprtM6L3riFAmOyM-ZC2Fp-
Christa Guzmán,Brooklyn NY,24,https://www.instagram.com/christa.guz/profilecard/?igsh=MWMzNnhjZGg1a2drcA==,christaguzman01@gmail.com,When I was 14 years old my older sister got a job,https://drive.google.com/open?id=1dMI_xKjjgSY9TP04IS_F3MYUXY87k4x5
Szohaib Khan,New York New York,21,https://www.instagram.com/szohaib_khan/profilecard/?igsh=MTdmYnI0dzlxZ2Rl,szkhan914@gmail.com,I miss climbing trees,https://drive.google.com/open?id=1sQ98YhbIhaq82sZdcsF630cfQ4fFD8lJ
Lindsey Martin,Queens NY,22,https://instagram.com/_lindseymartin_?igshid=YmMyMTA2M2Y=,linmartin1020@gmail.com,I mainly enjoy climbing for the sense of achievement,https://drive.google.com/open?id=1e5UkE1e4QLi2jKTZhqI-VYI4yuIUZPaP
Christopher De Leon,Flushing New York,33,Kr1z,Chrisdeleon91@gmail.com,Fun social group activity,https://drive.google.com/open?id=14vvu_Mp7ID3pmZw0CTY4AP87XIvCHw4j
Johnatan Tamayo Penilla,Hoboken NJ,21,https://www.instagram.com/johnatan_tam/profilecard/?igsh=Ynl1OTJncGRodmZi,Jtamayopenilla@gmail.com,The reason why I climb is because it has had,https://drive.google.com/open?id=1M8caSdXetFixHeOUMRuufKp7rDTaeWOn
Katherine Nunez,Peabody MA,38,https://www.instagram.com/kathycnunez/,Katherine.chum@yahoo.com,To move through my grief - recently widowed,https://drive.google.com/open?id=17kFT-IWDLGK2vOlDOBEQmeHW8YVxzsoB
Rosie Ramassamy,Paris France,26,_rxrosie,Rosie.gabriella@live.fr,I love sport with sensation like climbing,https://drive.google.com/open?id=19N35vua3C0bh7QR6X_UaT-8zKZHFyEGR
Victoria bell,West Jordan ut,38,https://www.instagram.com/victoriabell.jpg/,Vsbell33@gmail.com,To fully expand my horizons and push my limits,https://drive.google.com/open?id=1XoLJDisfnSMJqIHQ2yc1m-KT8mHKoVGC
Remy Yin,New York City New York,23,https://www.instagram.com/remyyin2nd/profilecard/?igsh=emtlY2RwOTF4OWt3,remy.yin@gmail.com,It's the most rewarding sport and incredibly fun,https://drive.google.com/open?id=1WvoIJvXh2oGwqKwRNFbBxI1pYbhRTwsb
Ayanleh Elmi Barreh,Paris,24,https://www.instagram.com/hedi_skinnyman/profilecard/?igsh=MTAwM21jYjV3NWpibw==,ayanleh.elmibarreh@gmail.com,Cause it's rewarding funny and I feel free,https://drive.google.com/open?id=13bdwg2ogyjohQ_HHA-bRjfidTixUlgqa
Pablo Fernández,Spain,23,@pvbloo_,pvblofernandez@gmail.com,Something beautiful is a sport where I can challenge,https://drive.google.com/open?id=1AWSgOtCAIwNv-PdMX3ObB4Oo-FdILgAb
Caroline Schnabel,LDN VIE NYC,36,@caro_schnabel,caroline.schnabel@gmx.net,Be present live the moment as well,https://drive.google.com/open?id=12JPw7VeGBJZ5NjoH6KfG8NWGTBH1laRA
Andrew Hsu,Brooklyn NY,30,choochoosendtrain,andrewhsu8@gmail.com,i love it. i love the community,
Alec Luu,Brooklyn NY,28,alec.luu,hey@alecluu.com,Initially I started climbing to rekindle a friendship,https://drive.google.com/open?id=1FmjDPrnT8e2oUoExxgWgFbUaOgGXglBd
Adrien Joseph,NYC NY,22,Adriienjoseph,Adrienjoseph810@gmail.com,Climbing to me is not only my favorite way,https://drive.google.com/open?id=11HgO_dQQDJEGMiUJNqPcRACmDYy5uDqF
Florian Guyénet,Paris,25,https://www.instagram.com/ralflorian?igsh=OGQ5ZDc2ODk2ZA%3D%3D&utm_source=qr,florianguyenet@gmail.com,I climb to work on my body with fun,https://drive.google.com/open?id=11_hGXtTTWfvrsZKAjoNgHBvaW1ua6rNX
Ryan Cordovez,New York Queens,19,@monkeyinreallife,nyar31159@gmail.com,I climb to push myself further physically,https://drive.google.com/open?id=18icvPv50TLRXWX2hmplEln8g331mgAgS
Kem Solid,Manhattan NY,35,https://www.instagram.com/kem_solid?igsh=a2tuOWZra3hlNXBk&utm_source=qr,Kpolydore@yahoo.com,I started climbing to help my performance,https://drive.google.com/open?id=1KB5eOtSAxeMAhtRWsqS8N-MR-iLU3zVI
Steve Lysak,Jersey City NJ,26,https://www.instagram.com/stephen__lysak/profilecard/?igsh=MXAzNWdjM2RrOHBpNQ==,stephen.lysak@gmail.com,Climbing's given me such a sense of community,https://drive.google.com/open?id=16YgaUXKJHVgS3v-RazYESGPYEeVYfO_F
Christof Inderbitzin,New York City,23,@christof.inder or @christofclimbs,Christof.inderbitzin@gmail.com,I climb for many reasons,https://drive.google.com/open?id=1ZFmRTe4jkNl5YH_yP0ltJaaCZmWQ6Ffq
Elias John Cabrera,Brooklyn NY,23,https://www.instagram.com/blissedpunk,cabreraelias0121@gmail.com,Climbing for me is nurturing my spirit,https://drive.google.com/open?id=1FVv36pAH6tfjC96GzjDqR7WAO5s0zSCe
tallen gabriel,brooklyn ny,30,@captaintallen,tallie.gabriel@gmail.com,the community and sense of accomplishment,https://drive.google.com/open?id=1LMliA-9kThWACid1aUsRciCRXknluwgm
Dumarys Espaillat,New York City NY,33,www.instagram.com/msmoonlightarts,d.espaillat8821@icloud.com,I started climbing recently,https://drive.google.com/open?id=17HvqExVHktALbwjhNdQ0qh0Tw4G1A-Pq
Satoshi Oyanagi,New York City,55,@prefabworks,Yoshie.s.j@gmail.com,Meditation!,https://drive.google.com/open?id=1zb__3NDa-d2aiJ70MJlds29PEANJCvoc
Zainab Rehman,Brooklyn NY,27,@_helloitsz_,znb.rehman68@gmail.com,I climb to overcome my fear of heights,https://drive.google.com/open?id=17wXS1fECF94RtmEfEgVRYoxiMWiZq4-D
HC SOHN,BROOKLYN,40,https://www.instagram.com/hc.sohn/profilecard/?igsh=MXQzMDFyNmVlZ204bw==,Hanchang.Sohn@gmail.com,I found climbing unintentionally,https://drive.google.com/open?id=1RvM_kLsw_dS152VMEtyxufUQPM5Wl1hY
Sofya Bazhanova,Lima Peru,28,@bsofyko,sofya0111@gmail.com,It's the best way to balance my mental health,https://drive.google.com/open?id=1TMzsaf-LfoTDurYZs4I3CNoWqtXds4JE
Jessica Navarrette,Brooklyn NY,26,@jesssickaaaa,jessicanavarrette16@gmail.com,I climb because it makes me feel alive,https://drive.google.com/open?id=1p7BizpO6aF98WBHrkF3dmwNu8paQnhjX
Katia cadavid,New York,21,https://www.instagram.com/cadavidkiki?igsh=MTc1enF2cGJkMWVodA%3D%3D&utm_source=qr,Kilicamu0323@gmail,As an ex-gymnast it was hard to get back,
Jes Vesconte,New York NY,28,Jes.vesconte,Jes.vesconte@gmail.com,Why do I climb?,https://drive.google.com/open?id=1q_IjG5VHS0vEBj-bX98QIO7xZyo0mlNX
Dallas Wade,Las Vegas,32,Instagram.com/DallasWade_,Flashmanwade@gmail.com,I climb because it's so freeing,https://drive.google.com/open?id=1zAUgL7TQplfMI-0Un0giIGL8jBbAY21I
Lauraine Laino,Farmingville NY,25,@laurainelaino,Lauriel1209@gmail.com,Being at a regular gym feels so isolating,https://drive.google.com/open?id=1YMcivxNfo1w1z3JgHEMX7MRHTAUhJXFK
Alyssa Vu,New York New York,23,@alysssavu,alyssavu01@gmail.com,I climb because it is a form of exercise,https://drive.google.com/open?id=1WrXAWrdecngKkzy_FHtEbGPf8OyKOERb
Natasha Greendyk,Brooklyn NY,32,https://www.instagram.com/natashagreendyk/,Greendyknv@gmail.com,Rock climbing has reconnected me,https://drive.google.com/open?id=1m64OI2qXposr3V0Sh7zJKtV5hZHm-Sfo
Chris Fleischman,Westfield NJ,53,Chris_Fleischman,Chris.fleischman@gmail.com,So many reasons,https://drive.google.com/open?id=1qZIQASpNtWX0saOFpiuMqzYeaidJGeZL
Michelle Guance,Bronx NY,29,@mchllllle_,Michelleguance@gmail.com,I climb because it keeps me present,https://drive.google.com/open?id=1oAIpSN_Hg5SVH4ghT95pbeKKnlkUbp7X
Gavin Keller,New York,20,Yogabagavin,Gavinkeller04@gmail.com,I honestly found it on kind of a whim,https://drive.google.com/open?id=1U0arsaCQX8hjNwMtI3CwESUVzaqkHAOB
Michelle,Brooklyn NY,40,https://www.instagram.com/michellefigs/profilecard/?igsh=MThzNGZtYjR3eDYyMA==,Michellefigs@gmail.com,I climb because its fun,https://drive.google.com/open?id=1pm7rmou0o7rE2hT360Vd8IbZrA4nmUU3
John Bubniak,NY,28,@johnbubniak,johnbubniak@gmail.com,climbing gets me out of my head,https://drive.google.com/open?id=1tgAALh4cGrUBZ0nobUgg-GpyCcoDl5lM
Joy Jiang,Brooklyn,34,Instagram.com/joy.nyc,Joyjiang18@gmail.com,I started climbing 6 years ago,https://drive.google.com/open?id=1f7baRTc1QR7S1Ao0-_yF_TvXcAZxiOuW
Mahalia Xiaoqi,Brooklyn NY,26,https://www.instagram.com/mahaliaxs,mahalia.xiaoqi@movementgyms.com,I first climbed with my oldest childhood friend,https://drive.google.com/open?id=1fvJD3QkbNJA1nbQZVq-KVhTa9VuZuDlq
Kaci Collins Jordan,New York City NY,31,https://www.instagram.com/kaci_sends_sometimes/profilecard/?igsh=ZnhzZ3dsZ212dzM4,kaci.collinsjordan@gmail.com,I have been climbing for about 13 years,https://drive.google.com/open?id=11_dVhB2Xm3CtPepeYDeOC2u7V_LdqpfQ
Katrine Kirsebom,BROOKLYN NY,25,miss__katrine__,kkirse@me.com,It's hard to say exactly why I climb,https://drive.google.com/open?id=12gkKL7u5zIRUL9-xVX-n7fP92LHAx-9P
Katie Belloff,Brooklyn NY,31,@kthebellz,Kbelloff22@gmail.com,My climbing community is my family,https://drive.google.com/open?id=1vsaUKa81XOVzUzShSN-Z6sMX5Pj1oRMK
Maxwell Stanley Gorraiz,Brooklyn NY,22,https://www.instagram.com/maxwellgorraiz/profilecard/?igsh=MW14Z3d5dDZkY3c0dw==,Maxwellgorraiz@gmail.com,I Boulder and top rope in the gyms,https://drive.google.com/open?id=1oVzAW0XVE6R3roa0HrhDkb8y3YIKVd-E
Glenn D'Avanzo,Ashland MA,59,https://www.instagram.com/mindsetfitnut/,gd76@comcast.net,Climbing initial was just another opportunity,https://drive.google.com/open?id=1yZl9KBElP1c0y9P4uPuva16rXXqTkyK2
florencia barletta,Miami,53,@florenciabarletta,Florenciabarletta@gmail.com,I love to do alpine climbing,https://drive.google.com/open?id=1t2PsIlQx8obwvAhYIjR7aDaCm9WsZQOQ
Jenni Poole,New York NY,29,@jennipooole,Jennipoolee@gmail.com,I climb because it helps me bridge,https://drive.google.com/open?id=1CJFvr08XPPp0VXWTtyD1-plKT-ebTrsw
Jose (Alex) Dias,Union NJ,53,https://www.instagram.com/alex.dias1971?igsh=NDlmd2xkajFycGtt&utm_source=qr,alex.dias.benfica@gmail.com,There are many parallels between climbing,https://drive.google.com/open?id=18Ltkd3jvCUfsIFN9rg_fjABWxFdPCZkp
Danielle Harper,Union City NJ,39,https://www.instagram.com/danimharper/profilecard/?igsh=MWZkZm42M2VkNDRraw==,Danimharper@gmail.com,I enjoy climbing,https://drive.google.com/open?id=1dOs12lrV55NhiPVVbXgJjskVUmC1EVJH
Peter Magnus Curry,New York NY,28,N/A,peter.magnus.curry@gmail.com,Climbing is technical and requires problem solving,https://drive.google.com/open?id=1VCF7tLRbWwaN6fISRbtCxEQn-WckuBqt
Elliott Wood,ATL GA,27,https://www.instagram.com/elliottlwood/profilecard/?igsh=NnJpYXltb2p1MHJ5,elliottleighwood@gmail.com,Freedom ability to overcome obstacles,https://drive.google.com/open?id=1JBplDTGIkKn4XARHE_v0GvwgePF6DWba
Donna H. Hansen,Denver,53,@donnasmojo,Donnasmojo@gmail.com,Remind myself I can still do it,https://drive.google.com/open?id=1jgdniqSwhsKWB0WKEuvlAk9xLEP5PkZI
Scott Bernard Nelson,Portland Oregon,53,https://www.instagram.com/scottbernardnelson/,scottbernardnelson@gmail.com,I'm in love with big-wall climbing,https://drive.google.com/open?id=1kK3HC3LKWBu97v5ruEgh6y-lYsSqHXzX
Debra Corley,Long Beach California,66,@embracingturning60,tulifts@gmail.com,I started rock climbing about 10 years ago,https://drive.google.com/open?id=1KtEfDPsqt0SPCztCWySaZFtzhM0KpdfG
Jonathan Chia-Ho Lee,Los Angeles CA,40,https://www.instagram.com/jclee_md/,jonchlee@gmail.com,It's a physical act that symbolizes,https://drive.google.com/open?id=1xXJ5srzv9OGcEONjsZPufC21XNcngVJe
Sarah Melgar,New York,28,https://www.instagram.com/sarah_melgar3/,sarah.o.melgar@gmail.com,I climb because it makes me feel strong,https://drive.google.com/open?id=1bHQwifHc7yvaOB9fZOB2p684EfoFjtbG
Destinee,New York New York,33,instagram.com/destineeryan118,destineeryan118@gmail.com,I climb because I love taking on the challenge,https://drive.google.com/open?id=1Oxbz2MHVdfwmqm5QzWl-6t57W8yNhieA
Alan Johnson,Dallas Texas,37,@alanjmodeling,aejohnson@me.com,I don't climb often,https://drive.google.com/open?id=1Gw-24NoVgUk3dCnx_T8wvaLxL0NWuAM9
Justin Seiller,Paramus New Jersey,27,Instagram.com/justinseiller,Justinseiller324@gmail.com,I like the substance that is within climbing,https://drive.google.com/open?id=1RvtZMv9hqLstWVTbYQjwdvvhOaDoDRLD
Caroline Buddendorf,Los Angeles CA,25,https://www.instagram.com/caroline_buddendorf/?hl=en,caroline.buddendorf@gmail.com,I climb because it makes me feel present,https://drive.google.com/open?id=16ledQvFzl0BJ72bJGT6Jp3w3Z50dvPeU
Joshua Chen,Brooklyn NY,27,https://www.instagram.com/illiteratejosh/,1997joshuachen@gmail.com,I like the excitement that it provides,https://drive.google.com/open?id=1F-LU0AjwvaKctE6hHC6C1kJmpwsoF_jz
Madeline Lopez,BROOKLYN NEW YORK,58,IG:@Madeline8497,Madelinelopez1313@gmail.com,Freedoms! Challenge,https://drive.google.com/open?id=1JK20jkO2V2T4NApbK5F7OUhZZpaOFLwm
Jasmine Hsu,Brooklyn NY,35,allezjas,jasminechsu@gmail.com,Mental health self-confidence,https://drive.google.com/open?id=1bZz7vRSFYX3HEqJ-_mZPghI7J7GOhh3Z
Theresa Vo,Garden Grove CA,25,@tree.vo and @tree.climbz,Connect.Theresavo@gmail.com,Not only is climbing a means of exercise,https://drive.google.com/open?id=1y5zx9LAGxR3UByJfBi-UmuPXZXlzHUsN
Mason Sammarco,Milwaukee Wisconsin,21,https://www.instagram.com/masonsammarco/,masonsammarco@gmail.com,I climb to push my limits,https://drive.google.com/open?id=1OO221xiksN4XzNlZhgd9uge7psUCO4dd
Jennifer Hessel,Chicago Illinois,23,https://www.instagram.com/itsj3nnnn/profilecard/?igsh=MXdwazg3c2oyNTlkag==,jxnnhxssxl@gmail.com,I climb as a way to move my body,https://drive.google.com/open?id=1EqGhKNB8eRIbmaAEpyPip56nCAXON9a6
Mireille Koyounian,Vernon CT,51,https://app.castingnetworks.com/talent/public-profile/576baece-a178-11ef-a1e8-a51bbfc02dc7,cosmodaisy24516@icloud.com,I don't I was interested in the role,https://drive.google.com/open?id=1omQG1I8AiGtQ0umYwzJuEItYPR7eQf00
Arden Lassalle,Los Angeles,29,https://www.instagram.com/theardener/?hl=en,ardener@gmail.com,I boulder around v5-6,https://drive.google.com/open?id=1-xixf_v3ZKX8JP8a6xnSiJfqnReqA8Ak
Dee Schmitz,Lake Hopatcong NJ,53,https://www.instagram.com/schmitzdee/,Dee@deezigns.com,It's my way of finding a way to climb,https://drive.google.com/open?id=1nL2hncO0wbA2v81Nq8lRxaZcL-uchmPv
Chad Halbrook,Denver CO,40,https://www.instagram.com/halbrookchad/profilecard/?igsh=MWYyb3p0ZDdxMnpmbw==,halbrookchad@gmail.com,I climb to challenge myself,https://drive.google.com/open?id=1MfGVNLxYVBs2B-aRptjKiQRCbUGlAgtr
Stephanie Whigham,San Jose CA,46,https://www.instagram.com/actslikestephanie/,stephanie@stephaniewhigham.com,I climb because it's fun,https://drive.google.com/open?id=1uCK4RnV_tE-Cpz_c6GMAUUF-iogwNMOS
Xixi Wang,New York NY,24,instagram.com/imxixiwang,xixiw615@gmail.com,I started climbing because I wanted to feel stronger,https://drive.google.com/open?id=1J5BTcE67Pq1rDkmb4cKOb6tzOsKKQHjE
Stephanie Mock,Brooklyn NY,29,stephaniemock,stephanie12365@gmail.com,I started climbing,https://drive.google.com/open?id=1cXQWULm3KS5kEzLi5Dq2Y7P4M8N9K0R1`;

(async () => {
  try {
    console.log(`\n📝 PARSING CLIMBER DATA...\n`);

    const lines = csvData.trim().split('\n');
    const climbers = lines.map(line => {
      const parts = line.split(',');
      return {
        first_name: parts[0]?.trim() || '',
        last_name: '',
        based_in: parts[1]?.trim() || '',
        age: parseInt(parts[2]) || null,
        instagram_handle: parts[3]?.trim().replace(/https:\/\/www\.instagram\.com\/|\/profilecard.*/g, '').replace(/\?.*/, '') || '',
        email: parts[4]?.trim() || '',
        notes: parts[5]?.substring(0, 200) || '',
      };
    }).filter(c => c.first_name);

    console.log(`Found ${climbers.length} climbers\n`);

    // Backup
    const backupDir = path.join(process.env.HOME, '.openclaw/workspace/backups');
    if (!require('fs').existsSync(backupDir)) {
      require('fs').mkdirSync(backupDir, { recursive: true });
    }
    const backupFile = path.join(backupDir, `2026-03-07-climbers-reimport-backup.json`);
    require('fs').writeFileSync(backupFile, JSON.stringify(climbers, null, 2));
    console.log(`✅ Backup saved: ${backupFile}\n`);

    // Import to database
    console.log(`Importing to database...`);

    const modelsData = climbers.map(c => ({
      first_name: c.first_name,
      last_name: c.last_name,
      based_in: c.based_in,
      date_of_birth: null,
      instagram_handle: c.instagram_handle,
      email: c.email,
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

    console.log(`\n✅ SUCCESS: Imported ${climbers.length} climbers`);
    console.log(`All set to reviewed=false (pending review)`);
    console.log(`All linked to source='climbers-tender-moments'\n`);

  } catch (e) {
    console.error('Error:', e.message);
  }
})();
