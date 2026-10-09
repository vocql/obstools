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

  // Change the ID for each new announcement so it appears again; set to null to disable it.
  announcement: {
    id: 'voqcl-stream-return-oct-28',
    title: 'We’re Live October 28',
    short: 'The wait is almost over. VOQCL returns to streaming on October 28.',
    date: 'Posted Oct 9',
    details: [
      'The countdown is on. I’m officially planning to return to streaming on October 28, 2026. It’s been a while, and I’m looking forward to getting back live and creating content again.',
      'Make sure you’re subscribed and have notifications turned on so you don’t miss the first stream back.'
    ],
    list: [
      'October 28: Stream return',
      'Live on YouTube',
      'More streams and content coming soon'
    ],
    link: {
      label: 'Subscribe on YouTube',
      url: 'https://www.youtube.com/@voqcl'
    }
  },

  youtube: 'https://www.youtube.com/@voqcl',   // your channel; the @handle here is the one checked for live streams

  contactEmail: 'voqcl@usa.com',   // shows the contact form on the Contact page
  showPreviewSwitch: false         // keep false on the real site
};
