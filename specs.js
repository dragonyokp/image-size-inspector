window.OPTWISE_SPECS=[
  {id:'AWC',name:'AWC',description:'Asset World Corporation',rules:[
    {id:'popup',label:'Popup / Intro Dialog',match:['popup','intro','dialog','modal'],sizes:{all:[800,450]},formats:['jpg','png']},
    {id:'hero',label:'Hero Banner',match:['hero','home-banner','homepage','slider'],sizes:{desktop:[1920,750],mobile:[768,1024]},safe:'Desktop: บน 90px · ซ้าย/ขวา 130px · ล่าง 180px | Mobile: บน 180px · ซ้าย/ขวา 60px · ล่าง 240px'},
    {id:'cover',label:'Cover Image',match:['cover','thumbnail','news-cover'],sizes:{all:[1200,630]},formats:['jpg']},
    {id:'content',label:'News Content',match:['content','article','news-content'],maxWidth:{horizontal:800,vertical:600},formats:['jpg','png']},
    {id:'gallery',label:'Image Gallery',match:['gallery','photo-gallery'],maxWidth:{horizontal:800,vertical:600},formats:['jpg','png']},
    {id:'video',label:'Video',match:['video','vdo','mp4'],sizes:{all:[900,506]},maxFileMB:10,formats:['mp4']},
    {id:'youtube',label:'YouTube Cover',match:['youtube','embed'],sizes:{all:[900,506]}},
    {id:'intro-artwork',label:'Intro Page Artwork',match:['intro-page','intro artwork'],sizes:{desktop:[1920,1080],mobile:[768,1280]},formats:['ai']},
    {id:'awards-cover',label:'Awards Cover',match:['award','recognition'],sizes:{all:[1200,800]},formats:['jpg']},
    {id:'logo',label:'Logo',match:['logo'],sizes:{all:[258,221]},formats:['png']}
  ]},
  {id:'EGCO',name:'EGCO',description:'Electricity Generating Public Company',rules:[
    {id:'home-video',label:'Home Banner Video',match:['hero','home','homepage','banner','video'],sizes:{all:[1920,1080]},ratio:'16:9',formats:['mp4']},
    {id:'popup',label:'Popup',match:['popup','intro','dialog','modal'],sizes:{all:[1200,800]},ratio:'3:2',formats:['jpg','png','webp']},
    {id:'highlight',label:'Highlight Banner',match:['highlight','highlights'],sizes:{all:[1528,550]},formats:['jpg','png','webp']},
    {id:'cover',label:'News Cover',match:['cover','thumbnail','news'],sizes:{all:[1000,667]},ratio:'3:2',formats:['jpg','png','webp']},
    {id:'content',label:'News Content',match:['content','article'],maxWidth:{horizontal:1000,vertical:650},formats:['jpg','png','webp']},
    {id:'gallery',label:'Image Gallery',match:['gallery'],maxWidth:{horizontal:1000,vertical:650},formats:['jpg','png','webp']},
    {id:'page-banner',label:'Page Banner',match:['page-banner','inner-banner','business-overview','board-of-directors'],sizes:{all:[1920,883]},formats:['jpg','png','webp']},
    {id:'menu-banner',label:'Menu Banner',match:['menu','menu-banner'],sizes:{all:[1920,553]},ratio:'18:5',formats:['jpg','png','webp']},
    {id:'board-image',label:'Board Image',match:['board','director'],sizes:{all:[790,720]},formats:['jpg','png','webp']}
  ]},
  {id:'MICRO',name:'MICRO',description:'Micro Leasing Public Company',rules:[
    {id:'hero',label:'Home Banner',match:['hero','home-banner','homepage','banner'],sizes:{desktop:[1920,640],mobile:[850,1144]},safe:'เว้นระยะขอบล่าง 160px'},
    {id:'cover',label:'News Cover',match:['cover','thumbnail','news'],sizes:{all:[800,600]},ratio:'4:3',formats:['jpg']},
    {id:'gallery',label:'Image Gallery',match:['gallery'],sizes:{all:[800,800]},ratio:'1:1',formats:['jpg']},
    {id:'content',label:'News Content',match:['content','article'],maxWidth:{horizontal:800,vertical:600},formats:['jpg','png']},
    {id:'youtube',label:'YouTube Embed',match:['youtube','embed','video'],ratio:'16:9'}
  ]},
  {id:'PTTGC',name:'PTTGC',description:'PTT Global Chemical',rules:[
    {id:'popup',label:'Popup / Intro Dialog',match:['popup','intro','dialog','modal'],sizes:{all:[1000,563]},ratio:'16:9',formats:['jpg','png','webp']},
    {id:'hero',label:'Hero Banner',match:['hero','home-banner','homepage','slider'],sizes:{desktop:[1920,1080],mobile:[1024,1367]},safe:'Desktop: บน 90px · ซ้าย/ขวา 130px · ล่าง 180px | Mobile: บน 180px · ซ้าย/ขวา 60px · ล่าง 240px'},
    {id:'banner',label:'Inner Banner',match:['banner','inner-banner'],sizes:{all:[1920,1080]},formats:['jpg','png','webp']},
    {id:'cover',label:'News Cover',match:['cover','thumbnail','news'],sizes:{all:[1000,563]},ratio:'16:9',formats:['jpg','png','webp']},
    {id:'content',label:'News Content',match:['content','article'],maxWidth:{horizontal:1000,vertical:650},formats:['jpg','png','webp']},
    {id:'gallery',label:'Image Gallery',match:['gallery'],maxWidth:{horizontal:1000,vertical:650},formats:['jpg','png','webp']},
    {id:'video',label:'Video',match:['video','vdo','mp4'],sizes:{all:[1920,1080]},ratio:'16:9',maxFileMB:10,formats:['mp4']},
    {id:'youtube',label:'YouTube Cover',match:['youtube','embed'],sizes:{all:[1000,563]},ratio:'16:9'}
  ]},
  {id:'PTTGC-SD',name:'PTTGC SD',description:'PTTGC Sustainability',rules:[
    {id:'popup',label:'Popup / Intro Dialog',match:['popup','intro','dialog','modal'],sizes:{all:[1000,563]},ratio:'16:9',formats:['jpg','png','webp']},
    {id:'hero',label:'Hero Banner',match:['hero','home-banner','homepage','slider'],sizes:{desktop:[1920,1080],mobile:[1024,1367]},safe:'Desktop: บน 90px · ซ้าย/ขวา 130px · ล่าง 180px | Mobile: บน 180px · ซ้าย/ขวา 60px · ล่าง 240px'},
    {id:'banner',label:'Inner Banner',match:['banner','inner-banner'],sizes:{all:[1920,1080]},formats:['jpg','png','webp']},
    {id:'news-cover',label:'News Cover',match:['news','cover','thumbnail'],sizes:{all:[1000,563]},ratio:'16:9',formats:['jpg','png','webp']},
    {id:'feature-cover',label:'Feature Stories Cover',match:['feature','featured'],sizes:{all:[1000,1130]},formats:['jpg','png','webp']},
    {id:'highlight-banner',label:'Highlight Project Banner',match:['highlight','project-banner'],sizes:{all:[1920,1080]},formats:['jpg','png','webp']},
    {id:'highlight-cover',label:'Highlight Project Cover',match:['highlight','project-cover'],sizes:{all:[1000,1000]},ratio:'1:1',formats:['jpg','png','webp']},
    {id:'content',label:'News Content',match:['content','article'],maxWidth:{horizontal:1000,vertical:650},formats:['jpg','png','webp']},
    {id:'gallery',label:'Image Gallery',match:['gallery'],maxWidth:{horizontal:1000,vertical:650},formats:['jpg','png','webp']},
    {id:'video',label:'Video',match:['video','vdo','mp4'],sizes:{all:[1920,1080]},ratio:'16:9',maxFileMB:10,formats:['mp4']},
    {id:'youtube',label:'YouTube Cover',match:['youtube','embed'],sizes:{all:[1000,563]},ratio:'16:9'}
  ]},
  {id:'RABBIT',name:'RABBIT',description:'Rabbit Holdings',rules:[
    {id:'home-video',label:'Home Banner Video Desktop',match:['hero','home','homepage','banner','video'],sizes:{all:[1920,926]},formats:['mp4']},
    {id:'laptop-video',label:'Home Banner Video Laptop',match:['hero','home','homepage','banner','video'],sizes:{all:[1920,730]},formats:['mp4']}
  ]},
  {id:'TURTLE',name:'TURTLE',description:'Super Turtle',rules:[
    {id:'home-hero',label:'Home Hero Banner',match:['hero','home','homepage'],sizes:{desktop:[1366,665],tablet:[768,926],mobile:[375,590]},safe:'เว้นระยะขอบอย่างน้อย 60px รอบด้าน'},
    {id:'home-news',label:'Home News and Promotions',match:['news','promotion'],sizes:{all:[1480,648]}},
    {id:'product-highlight',label:'Product Highlights',match:['product','highlight'],sizes:{all:[520,520]},ratio:'1:1'},
    {id:'home-banner',label:'Home Banner',match:['banner'],sizes:{all:[1920,826]}},
    {id:'business-image',label:'Business Image',match:['business'],sizes:{all:[1024,1024]},ratio:'1:1',formats:['png']},
    {id:'shortcut',label:'Shortcut Links',match:['shortcut','quick-link'],sizes:{all:[1000,667]}},
    {id:'investor-hero',label:'Investor Relations Hero',match:['investor','hero'],sizes:{all:[1920,755]}},
    {id:'latest-docs',label:'Latest Documents',match:['document','latest'],sizes:{all:[500,500]},ratio:'1:1'},
    {id:'set-announcements',label:'SET Announcements',match:['set','announcement'],sizes:{all:[1146,1176]}},
    {id:'board-banner',label:'Board of Directors Banner',match:['board','banner'],sizes:{all:[1980,830]}},
    {id:'leadership-image',label:'Leadership Image',match:['leadership','director'],sizes:{all:[512,512]},ratio:'1:1'},
    {id:'rewards-banner',label:'Rewards Banner',match:['reward','promotion'],sizes:{all:[1480,648]}},
    {id:'rewards-content',label:'Rewards Content',match:['reward','promotion'],sizes:{all:[800,600]},ratio:'4:3'},
    {id:'ceo-message',label:'CEO Message Image',match:['ceo','message'],sizes:{all:[1920,692]}},
    {id:'company-history',label:'Company History Image',match:['history'],sizes:{all:[890,480]}},
    {id:'content-banner',label:'Content Banner',match:['content-banner'],sizes:{all:[1920,562]}},
    {id:'content',label:'Content Image',match:['content','article'],maxWidth:{horizontal:800,vertical:600},formats:['jpg','png']},
    {id:'business-content',label:'Business Content',match:['business'],ratio:'1:1'}
  ]}
];
