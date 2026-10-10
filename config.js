/* =====================================================================
   VOQCL SITE SETTINGS — this is the only file you need to edit.
   Every page on the site reads this one file.

   GOING LIVE:
     liveMode: 'auto'    -> detects when you're live on YouTube (via status.json,
                            updated by the GitHub Action every ~5 min). If that
                            isn't set up yet, it falls back to your schedule.
     liveMode: 'live'    -> forces LIVE NOW on instantly
     liveMode: 'offline' -> forces offline instantly
   Save the file and upload it to GitHub. The site updates in about a minute.
   ===================================================================== */
window.CONFIG = {
  timezone: 'America/Chicago',   // your time zone; the schedule below is in this zone

  // 'auto'    = detect from YouTube (falls back to schedule)
  // 'live'    = force live
  // 'offline' = force offline
  liveMode: 'auto',

  statusFile: 'status.json',      // written by the GitHub Action; '' to turn detection off

  // YouTube Data API v3 key. With it, the site checks your channel every minute and
  // pulls the exact live stream, title, thumbnail, viewer count and start time.
  // Restrict the key to voqcl.com in Google Cloud. Leave '' to rely on the GitHub Action only.
  youtubeApiKey: 'AIzaSyDf0drdVyYSq96hKyUmiENxxO4DuQ6l6E4',

  // used when forced live, or as fallbacks (detection fills in the real title/link/thumbnail)
  live: {
    title: 'Chill stream, come hang out',  // '' = use the schedule title
    platform: 'YouTube',
    url: 'https://www.youtube.com/@voqcl/live',
    viewers: null,                          // a number to show manually; null = auto (needs youtubeApiKey) or hide
    thumbnail: ''                           // image URL, or '' for the animated placeholder
  },

  schedule: [
    { day: 'Mon', start: '14:00', end: '16:00', title: 'Live on YouTube' },
    { day: 'Wed', start: '14:00', end: '16:00', title: 'Live on YouTube' },
    { day: 'Fri', start: '14:00', end: '16:00', title: 'Live on YouTube' }
  ],

  youtube: 'https://www.youtube.com/@voqcl',   // your channel; the @handle here is the one checked for live streams

  // ===== CREATORS =====
  // Everyone visitors can switch between with the picker in the navbar. The FIRST one is you.
  // Picking a creator switches the navbar logo + name, home card, About, Contact, Schedule and Live.
  //   youtube:    their channel link (that's all you need; everything else is optional)
  //   pfp:        '' = from YouTube, '/creators/file.png' = uploaded to your repo, or any image link
  //   background: same options ('' = their YouTube banner)
  //   socials:    buttons on the home card + Contact page (youtube, twitch, tiktok, instagram, x, discord, email)
  //   schedule:   same format as yours above; leave out start/end for "time varies"
  //   about:      optional short bio for their About page
  //   email:      optional; shows an email button + form on their Contact page
  creators: [
    {
      id: 'voqcl',
      name: 'voqcl',
      youtube: 'https://www.youtube.com/@voqcl',
      pfp: '/pfp.png',
      background: '/bg.png',
      socials: [
        { type: 'youtube',   url: 'https://www.youtube.com/@voqcl' },
        { type: 'instagram', url: 'https://www.instagram.com/voqcl' },
        { type: 'x',         url: 'https://x.com/vocqll' },
        { type: 'twitch',    url: 'https://www.twitch.tv/voqcl' },
        { type: 'tiktok',    url: 'https://www.tiktok.com/@voqcl' }
      ]
    },
    {
      id: 'theurbanshogun',
      name: 'TheUrbanShogun',
      youtube: 'https://www.youtube.com/@TheUrbanShogun',
      pfp: '/creators/shogun-pfp.png',
      background: '',
      socials: [
        { type: 'youtube', url: 'https://www.youtube.com/@TheUrbanShogun' }
      ],
      // no times yet, so these show as "Time varies". Add start: '14:00', end: '16:00' (24-hour) once you know them.
      schedule: [
        { day: 'Mon', title: 'Live on YouTube' },
        { day: 'Tue', title: 'Live on YouTube' },
        { day: 'Thu', title: 'Live on YouTube' },
        { day: 'Sat', title: 'Live on YouTube' },
        { day: 'Sun', title: 'Live on YouTube' }
      ]
    },
    {
      id: 'willmacgta',
      name: 'WillMacGTA',
      youtube: 'https://www.youtube.com/@WillMacGTA',
      pfp: '/creators/willmac-pfp.png',
      background: '/creators/willmac-bg.png',
      email: 'willmacgta@gmail.com',
      socials: [
        { type: 'youtube',   url: 'https://www.youtube.com/@WillMacGTA' },
        { type: 'twitch',    url: 'https://www.twitch.tv/willmacgta' },
        { type: 'x',         url: 'https://twitter.com/willmacgta' },
        { type: 'tiktok',    url: 'https://www.tiktok.com/@willmacgta' },
        { type: 'instagram', url: 'https://www.instagram.com/willmacgta' },
        { type: 'discord',   url: 'https://discord.gg/WUbvVafvT4' }
      ],
      schedule: []
    }
  ],

  contactEmail: 'voqcl@usa.com',   // shows the contact form on your Contact page
  showPreviewSwitch: false         // keep false on the real site
};
