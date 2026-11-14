export type Site = {
  id: string
  name: string
  program: string
  lat: number
  lon: number
  note: string
}

export const sites: Site[] = [
  {
    id: 'shackleton',
    name: 'Shackleton rim',
    program: 'Artemis',
    lat: -89.78,
    lon: 0,
    note: 'South-pole rim. The Sun skims the horizon and Earth stays low.',
  },
  {
    id: 'de-gerlache',
    name: 'de Gerlache rim',
    program: 'Artemis',
    lat: -88.5,
    lon: -87.1,
    note: 'Connecting ridge toward Shackleton, studied for longer surface stays.',
  },
  {
    id: 'haworth',
    name: 'Haworth',
    program: 'CLPS',
    lat: -86.75,
    lon: -4,
    note: 'Deep polar crater. Nearby ridges catch a raking Sun while the floor stays dark.',
  },
  {
    id: 'nobile',
    name: 'Nobile',
    program: 'Artemis',
    lat: -85.4,
    lon: 31.2,
    note: 'South-pole crater region tied to rover exploration plans.',
  },
  {
    id: 'malapert',
    name: 'Malapert massif',
    program: 'CLPS',
    lat: -85.99,
    lon: -2,
    note: 'High ground near the pole, with Earth close to the horizon.',
  },
  {
    id: 'faustini',
    name: 'Faustini',
    program: 'Artemis',
    lat: -87.2,
    lon: 77,
    note: 'Polar crater used in studies of cold traps and Earth visibility.',
  },
  {
    id: 'cabeus',
    name: 'Cabeus',
    program: 'NASA',
    lat: -84.9,
    lon: -35.5,
    note: 'LCROSS impact area. A known cold-trap crater in the south.',
  },
  {
    id: 'odysseus',
    name: 'Malapert A',
    program: 'CLPS',
    lat: -80.13,
    lon: 1.44,
    note: 'Near the IM-1 landing. Farther from the pole, Earth sits a little higher.',
  },
  {
    id: 'chandrayaan3',
    name: 'Shiv Shakti Point',
    program: 'ISRO',
    lat: -69.37,
    lon: 32.32,
    note: 'Chandrayaan-3 landing. The Sun climbs much higher than it does at the pole.',
  },
  {
    id: 'apollo11',
    name: 'Tranquility Base',
    program: 'Apollo',
    lat: 0.67,
    lon: 23.47,
    note: 'Apollo 11. Earth stands high in the sky, and day and night each last about two weeks.',
  },
  {
    id: 'apollo15',
    name: 'Hadley-Apennine',
    program: 'Apollo',
    lat: 26.13,
    lon: 3.63,
    note: 'Apollo 15. A mid-latitude near-side plain at the mountain front.',
  },
  {
    id: 'apollo17',
    name: 'Taurus-Littrow',
    program: 'Apollo',
    lat: 20.19,
    lon: 30.77,
    note: 'Apollo 17. Near-side highlands with a high Earth and a long solar day.',
  },
  {
    id: 'change4',
    name: 'Von Kármán',
    program: 'CNSA',
    lat: -45.44,
    lon: 177.6,
    note: 'Chang’e 4 on the far side. Earth stays below the horizon.',
  },
  {
    id: 'change5',
    name: 'Oceanus Procellarum',
    program: 'CNSA',
    lat: 43.06,
    lon: -51.92,
    note: 'Chang’e 5 sample-return region on the near side.',
  },
  {
    id: 'slim',
    name: 'Shioli',
    program: 'JAXA',
    lat: -13.31,
    lon: 25.25,
    note: 'SLIM landing near Shioli crater, on the near side.',
  },
  {
    id: 'blue-ghost',
    name: 'Mare Crisium',
    program: 'CLPS',
    lat: 18.56,
    lon: 61.81,
    note: 'Blue Ghost region. Earth is high, and the solar day is a long even arc.',
  },
]

export function siteById(id: string): Site {
  const site = sites.find((entry) => entry.id === id)
  if (!site) {
    throw new Error(`Unknown site ${id}`)
  }
  return site
}

export function otherSiteId(id: string): string {
  const index = sites.findIndex((entry) => entry.id === id)
  return sites[(index + 1) % sites.length]?.id ?? sites[0].id
}
