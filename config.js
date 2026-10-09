/* =====================================================================
   VOQCL SITE SETTINGS — this is the only file you need to edit.

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

  // Live viewer count from YouTube. Paste a YouTube Data API v3 key here.
  // Restrict the key to your site (see steps in the chat) so nobody else can use it.
  // Leave '' to hide the viewer count.
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
    { day: 'Mon', start: '12:00', end: '16:00', title: 'Live on YouTube' },
    { day: 'Tue', start: '12:00', end: '16:00', title: 'Live on YouTube' },
    { day: 'Wed', start: '12:00', end: '16:00', title: 'Live on YouTube' },
    { day: 'Thu', start: '12:00', end: '16:00', title: 'Live on YouTube' },
    { day: 'Fri', start: '12:00', end: '16:00', title: 'Live on YouTube' }
  ],

  // change the id for each new announcement so it shows again; set to null to turn it off
  announcement: {
    id: 'new-series-oct',
    title: 'New series starts Monday',
    short: 'Same time, new format. Here\'s what\'s changing next week.',
    date: 'Posted Oct 9',
    details: [
      'Starting Monday I\'m trying something new on stream. Streams stay at the usual time, the first hour just looks a bit different.',
      'Turn on notifications so you catch the first episode.'
    ],
    list: ['Monday: episode one', 'Wednesday: viewer picks', 'Friday: recap and Q&A'],
    link: { label: 'Turn on notifications', url: 'https://www.youtube.com/@voqcl' }
  },

  youtube: 'https://www.youtube.com/@voqcl',
  // add thumb: 'image-url' to use a real thumbnail
  vods: [
    { title: 'Full stream replay', date: 'Oct 8', duration: '3:58:12', url: 'https://www.youtube.com/@voqcl/streams' },
    { title: 'Best moments of the week', date: 'Oct 6', duration: '12:40', url: 'https://www.youtube.com/@voqcl/videos' },
    { title: 'Full stream replay', date: 'Oct 6', duration: '4:02:55', url: 'https://www.youtube.com/@voqcl/streams' },
    { title: 'Chat picks the game', date: 'Oct 2', duration: '3:47:30', url: 'https://www.youtube.com/@voqcl/streams' },
    { title: 'Late night chill stream', date: 'Sep 30', duration: '2:15:08', url: 'https://www.youtube.com/@voqcl/streams' },
    { title: 'September highlights', date: 'Sep 28', duration: '18:22', url: 'https://www.youtube.com/@voqcl/videos' }
  ],

  contactEmail: 'voqcl@usa.com',   // shows the contact form on the Contact page
  showPreviewSwitch: true          // set to false before uploading
};
