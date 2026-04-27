// Seeds Christina Cox · OKC Memorial Marathon 2026 archive.
// Source: Downloads/race-day-master-data.md (compiled 2026-04-26).
// Re-running upserts; safe to repeat.

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

if (!process.env.DATABASE_URL) {
  try {
    const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set (checked env + .env.local)');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const RACE_SLUG   = 'okc-2026';
const RUNNER_SLUG = 'christina';
const RACE_NAME   = '2026 Oklahoma City Memorial Marathon';
const RACE_DATE   = '2026-04-26';
const RUNNER_NAME = 'Christina Cox';
const HEADLINE    = '3:50:32';

const data = {
  runner: {
    name: 'Christina Cox',
    hometown: 'Moore, OK',
    bib: '648',
    ageGroup: 'F 30-34',
    role: 'Self-coached, training for marathon PR',
    priorContext: 'Walked sections she later regretted; key motivation for 2026 race was to "not walk".',
    garminUser: true,
  },
  race: {
    event: '2026 Oklahoma City Memorial Marathon',
    distanceMi: 26.2,
    date: '2026-04-26',
    gunTime: '6:30 AM CDT',
    location: 'Oklahoma City, OK',
    startLine: 'Memorial Museum, N Harvey Ave',
    finishLine: 'Scissortail Park, Oklahoma City Blvd',
    titleSponsor: 'Devon',
    timingProvider: 'MyChipTime',
    liveTracker: 'FindMyMarathon',
    fieldSize: 2510,
    actualStart: '6:33:14 AM',
    corralDelay: '3:14',
  },
  result: {
    chipTime: '3:50:32',
    avgPace: '8:48',
    goalTime: '3:57:00',
    beatGoalBy: '6:28',
    didNotWalk: true,
    placement: {
      overall:   { place: 400, field: 2510, percentile: 'Top 16.0%' },
      gender:    { place: 63,  field: 886,  percentile: 'Top 7.2%',  label: 'Gender (F)' },
      ageGroup:  { place: 15,  field: 152,  percentile: 'Top 9.9%',  label: 'F 30-34' },
    },
    halves: {
      first:  { time: '1:54:14', pace: '8:43' },
      second: { time: '1:56:18', pace: '8:53' },
      netSplit: '+2:04 positive (heat-driven)',
    },
    halvesNote: 'Pace plan called for a slight negative split. The +2:04 positive split is consistent with heat impact on a fitness level that otherwise would have produced a true negative split.',
  },
  prePlan: {
    goalTime: '3:57:00',
    avgPace: '9:02.4',
    halfTarget: '1:58:50',
    structure: 'Slight negative split (~40 sec faster back half)',
    miles: [
      { mile: 1,  split: '8:56', elapsed: '0:08:56', notes: 'Steady opener' },
      { mile: 2,  split: '9:17', elapsed: '0:18:13', notes: 'Lincoln climb (slowest planned)' },
      { mile: 3,  split: '9:03', elapsed: '0:27:16', notes: '' },
      { mile: 4,  split: '9:00', elapsed: '0:36:16', notes: '' },
      { mile: 5,  split: '8:51', elapsed: '0:45:08', notes: 'First gravity assist' },
      { mile: 6,  split: '8:54', elapsed: '0:54:01', notes: '' },
      { mile: 7,  split: '9:16', elapsed: '1:03:18', notes: 'Shartel climb (2nd-slowest planned)' },
      { mile: 8,  split: '8:53', elapsed: '1:12:11', notes: 'Half/Full split' },
      { mile: 9,  split: '9:10', elapsed: '1:21:21', notes: '' },
      { mile: 10, split: '9:10', elapsed: '1:30:31', notes: '' },
      { mile: 11, split: '9:11', elapsed: '1:39:42', notes: '' },
      { mile: 12, split: '9:14', elapsed: '1:48:56', notes: '' },
      { mile: 13, split: '8:55', elapsed: '1:57:51', notes: '' },
      { mile: 14, split: '9:02', elapsed: '2:06:52', notes: '' },
      { mile: 15, split: '9:01', elapsed: '2:15:53', notes: '' },
      { mile: 16, split: '8:58', elapsed: '2:24:51', notes: '' },
      { mile: 17, split: '9:02', elapsed: '2:33:53', notes: '' },
      { mile: 18, split: '9:00', elapsed: '2:42:52', notes: '' },
      { mile: 19, split: '8:50', elapsed: '2:51:43', notes: 'Britton descent (fastest planned)' },
      { mile: 20, split: '8:52', elapsed: '3:00:34', notes: 'Continued descent' },
      { mile: 21, split: '9:01', elapsed: '3:09:35', notes: '' },
      { mile: 22, split: '9:17', elapsed: '3:18:53', notes: 'Downtown return (slowest in back half)' },
      { mile: 23, split: '9:07', elapsed: '3:27:59', notes: '' },
      { mile: 24, split: '9:10', elapsed: '3:37:09', notes: '' },
      { mile: 25, split: '8:57', elapsed: '3:46:06', notes: '' },
      { mile: 26, split: '8:56', elapsed: '3:55:02', notes: '' },
    ],
    finalSegment: { distance: 0.2, split: '1:58', elapsed: '3:57:00' },
    analysis: 'The pace band\'s slowest miles aligned exactly with the three hardest course segments: Lincoln climb (M2), Shartel climb (M7), downtown return (M22). The fastest scheduled miles aligned with the Britton descent (M19-20). The plan-builder knew the course.',
  },
  officialSplits: [
    { point: 'START',      distanceMi: 0,      elapsed: '00:00:00', timeOfDay: '6:33:14 AM',  pace: null     },
    { point: '5K',         distanceMi: 3.11,   elapsed: '0:27:16',  timeOfDay: '7:00:30 AM',  pace: '8:47'   },
    { point: '10K',        distanceMi: 6.21,   elapsed: '0:54:27',  timeOfDay: '7:27:40 AM',  pace: '8:45'   },
    { point: '15K',        distanceMi: 9.32,   elapsed: '1:22:03',  timeOfDay: '7:55:16 AM',  pace: '8:53'   },
    { point: '20K',        distanceMi: 12.43,  elapsed: '1:48:09',  timeOfDay: '8:21:23 AM',  pace: '8:25'   },
    { point: 'HALF',       distanceMi: 13.11,  elapsed: '1:54:14',  timeOfDay: '8:27:27 AM',  pace: '8:55', highlight: true },
    { point: '25K',        distanceMi: 15.53,  elapsed: '2:15:17',  timeOfDay: '8:48:30 AM',  pace: '8:41'   },
    { point: '30K',        distanceMi: 18.64,  elapsed: '2:42:05',  timeOfDay: '9:15:19 AM',  pace: '8:38'   },
    { point: '35K',        distanceMi: 21.75,  elapsed: '3:09:23',  timeOfDay: '9:42:37 AM',  pace: '8:48'   },
    { point: '40K',        distanceMi: 24.85,  elapsed: '3:37:49',  timeOfDay: '10:11:03 AM', pace: '9:10'   },
    { point: '1M2GO',      distanceMi: 25.2,   elapsed: '3:41:07',  timeOfDay: '10:14:20 AM', pace: '9:33'   },
    { point: 'FINISH',     distanceMi: 26.2,   elapsed: '3:50:32',  timeOfDay: '10:23:46 AM', pace: '9:16', highlight: true },
  ],
  segments: [
    { label: 'Start → 5K',     distanceMi: 3.11, time: '27:16', paceSec: 527, pace: '8:47', vsPrevSec: null, vsPrev: null    },
    { label: '5K → 10K',       distanceMi: 3.11, time: '27:11', paceSec: 525, pace: '8:45', vsPrevSec: -2,  vsPrev: '−0:02' },
    { label: '10K → 15K',      distanceMi: 3.11, time: '27:36', paceSec: 533, pace: '8:53', vsPrevSec: 8,   vsPrev: '+0:08' },
    { label: '15K → 20K',      distanceMi: 3.11, time: '26:06', paceSec: 505, pace: '8:25', vsPrevSec: -28, vsPrev: '−0:28', isPeak: true       },
    { label: '20K → 25K',      distanceMi: 3.11, time: '27:08', paceSec: 521, pace: '8:41', vsPrevSec: 16,  vsPrev: '+0:16' },
    { label: '25K → 30K',      distanceMi: 3.11, time: '26:48', paceSec: 518, pace: '8:38', vsPrevSec: -3,  vsPrev: '−0:03' },
    { label: '30K → 35K',      distanceMi: 3.11, time: '27:18', paceSec: 528, pace: '8:48', vsPrevSec: 10,  vsPrev: '+0:10' },
    { label: '35K → 40K',      distanceMi: 3.11, time: '28:26', paceSec: 550, pace: '9:10', vsPrevSec: 22,  vsPrev: '+0:22', isFadeOnset: true },
    { label: '40K → Finish',   distanceMi: 1.35, time: '12:43', paceSec: 565, pace: '9:25', vsPrevSec: 15,  vsPrev: '+0:15' },
  ],
  segmentObservations: [
    'Fastest 5K segment: 15K → 20K at 8:25, through Britton neighborhood loop and onto Britton descent.',
    'Slowest body-of-race 5K: 35K → 40K at 9:10 (fade onset).',
    'Most consistent stretch: Start → 30K at 8:43 average across nine continuous timing points.',
    'Net deceleration peak → finish: 8:25 → 9:25 = +60 sec/mi swing across the back half.',
  ],
  phases: [
    {
      number: 1,
      label: 'Opening third',
      miles: 'Start → 10K, miles 0 to 6.21',
      elapsed: '0:54:27',
      paceAvg: '8:46',
      vsPlan: '~14 sec/mi faster than plan (9:02)',
      read: 'Christina ran ~15 sec/mi faster than her pace band from the gun. Initial concern was adrenaline overrun. By 10K, the consistency between the 5K (8:47) and 10K (8:45) splits suggested actual fitness rather than adrenaline. Notably, she sped up through the Shartel climb (mile 7), which was scheduled as one of her hardest miles.',
    },
    {
      number: 2,
      label: 'Middle third',
      miles: '10K → 25K, miles 6.21 to 15.53',
      segmentTime: '1:20:50',
      paceAvg: '8:38',
      includes: 'Shartel climb (M7), Britton peak (~1,280 ft, M15), Britton descent',
      halfwaySplit: '1:54:14 (4:36 ahead of plan)',
      read: 'Fastest segment of her race (15K → 20K at 8:25). Mid-race acceleration through the Britton neighborhood loop, leveraging course descent. Pace plan expected 8:50 to 8:58 here; she ran 8:25. By 25K she was committed to a sub-3:50 finish trajectory.',
    },
    {
      number: 3,
      label: 'Final third',
      miles: '25K → Finish, miles 15.53 to 26.2',
      segmentTime: '1:35:15',
      paceAvg: '8:55',
      pattern: 'Steady decline: 8:38 → 8:48 → 9:10 → 9:25',
      read: 'The fade is real but controlled. No single catastrophic mile. Heat compounded with cumulative load. Final mile at 9:25 includes the descent into Scissortail Park. No walking.',
    },
  ],
  course: {
    elevation: {
      lowFt: 1100,
      highFt: 1280,
      netChange: 'Net rolling, no sustained climb',
      peak: 'Approximately mile 15 (Britton, near Drakestone Ave)',
      finalDescent: '~50 to 80 ft drop into Scissortail Park, last mile',
    },
    miles: [
      { range: '1-4',   feature: 'Downtown loop east via NE 4th, up Lincoln Blvd to NE 23rd, then west on NE 18th' },
      { range: '5-8',   feature: 'Northbound through Robinson Ave, Harvey Pkwy, Shartel Ave, gradual climb' },
      { range: '~8',    feature: 'Half/Full split at NW 50th & Shartel' },
      { range: '8-13',  feature: 'Continued north via Classen Blvd → Western Ave → NW Grand Blvd → Britton' },
      { range: '13-17', feature: 'Britton neighborhood loop (highest point of course): Greystone, Lakehurst, Drakestone' },
      { range: '17-21', feature: 'Return south via NW Grand Blvd → Classen Blvd, net descent' },
      { range: '22-26', feature: 'Downtown finish via Classen → NW 18th → Shartel → Harvey → finish at Scissortail Park' },
    ],
    aidStations: 'Hydration stations approximately every 2 miles. Medical and relief stations distributed throughout.',
    closures: [
      'N Western Ave',
      'N Classen Blvd',
      'NW Grand Blvd',
      'Wilshire Blvd (immediate vicinity)',
      'NW 50th area reopens approximately 9:55 AM',
    ],
  },
  conditions: {
    raceStart:       { time: '6:30 AM', tempF: 64, notes: 'Partly sunny' },
    forecastHighF:   83,
    christinaFinish: { time: '~10:23 AM', tempF: 75, notes: 'Estimated; warming throughout race' },
    heatImpactAnalysis: 'The 2:04 positive split (first half 1:54:14 vs second half 1:56:18) is consistent with heat-induced fade rather than fitness limit or glycogen depletion. The pace pattern (strong through 25K, gradual decline thereafter) follows the temperature curve. Glycogen-depletion fade typically presents as a sharper drop around miles 18 to 20; Christina\'s fade was more diffuse and progressive, the signature of thermoregulatory load.',
  },
  training: {
    timePeriod: '12 weeks (Feb 2 → Apr 26 2026)',
    peakWeeklyMileage: 58,
    peakWeekStarting: '2026-03-22',
    monthlyTotals: { march: 180.45, aprilThroughRace: 150 },
    lowestWeekly: 14,
    raceWeekVolume: 'Tapered (single run shown)',
    activityCount: '1 (race week) → 6 (peak); most weeks: 5 activities',
    hrZoneDistribution: {
      peakTotalHrTime: '~9 hours (week of Mar 22)',
      dominantZone: 'Zone 2 (aerobic base)',
      zone5Presence: 'Regular but minor share',
      zone1Presence: 'Minimal, most easy runs were Zone 2 / aerobic',
      pattern: 'Textbook polarized / pyramidal marathon distribution: high aerobic volume, modest threshold work, minimal junk.',
    },
    trainingEffect: {
      aerobicRange: '4.0-5.0',
      anaerobicRange: '1.0-2.0',
      interpretation: 'Training stimulus was almost entirely aerobic. Matches the goal (marathon, sub-4) and produced a runner who could hold steady pace deep into the race.',
    },
    hrv: {
      predominant: 'Balanced',
      dips: 'Occasional Unbalanced (likely post-hard-session days). One late-build dip near race week, returning to Balanced by race day.',
      interpretation: 'Recovery was keeping pace with training load, no chronic stress accumulation.',
    },
    rhr: {
      earlyBuild: '56-63 bpm',
      midBuild:   '54-60 bpm',
      lateBuild:  '51-58 bpm',
      interpretation: 'Resting HR trending down across a 12-week cycle is the signature of cardiovascular adaptation. By race week, RHR was at the lowest range of the build, peak fitness indicator.',
    },
    trainingStatus: [
      { color: 'yellow', label: 'Maintaining', when: 'Early weeks' },
      { color: 'blue',   label: 'Recovery',    when: 'Recovery weeks interspersed' },
      { color: 'green',  label: 'Productive',  when: 'Dominant status across the build' },
      { color: 'mixed',  label: 'Recovery / Productive', when: 'Final two weeks (taper)' },
    ],
    trainingLoadNotes: [
      'Acute load fluctuating around chronic load (proper periodization)',
      'Chronic load steady ~1,300-1,500 across the bulk of the build',
      'High Aerobic Load, primary contributor every week',
      'Low Aerobic Load, present but minor',
      'Anaerobic Load, minimal, in only a few weeks',
    ],
    translation: [
      { signal: 'Aerobic Training Effect 4.0-5.0', manifestation: 'Held 8:25 to 8:48 pace through 30K' },
      { signal: 'Predominantly Zone 2 base',        manifestation: 'No early blow-up despite running 14 sec/mi faster than plan' },
      { signal: 'RHR trending down → race week',    manifestation: 'Cardiovascular peak hit at the right time' },
      { signal: 'Balanced HRV',                     manifestation: 'Body recovered into race week, no taper-week stress spike' },
      { signal: 'Productive training status',       manifestation: '"Boringly correct" build, no overreach, no undertrain' },
    ],
    bottomLine: 'A 12-week build that produces this profile of metrics produces a runner capable of sub-3:50 in moderate heat. The race was the receipt; the training was the work.',
  },
  crew: {
    composition: [
      { member: 'Dalton (husband)', role: 'Driver, primary crew, mission control' },
      { member: 'Skye',             role: 'Spotter, sponge hand-off' },
      { member: 'Asher (child)',    role: 'Passenger' },
      { member: 'Bear (child)',     role: 'Passenger (forgot shoes, became part of CP3 logistics)' },
    ],
    checkpoints: [
      { label: 'CP1',    location: '945 W Wilshire Blvd',                      mile: 10.5, plannedArrival: '7:53 AM', christinaArrival: '~8:05 AM',  outcome: 'success', summary: 'Clean hand-off (bottle + ice)' },
      { label: 'CP2',    location: '7550 N May Ave (May & Grand Blvd staging)', mile: 17.5, plannedArrival: '8:30 AM', christinaArrival: '~9:03 AM',  outcome: 'missed',  summary: 'Missed (timing/positioning)' },
      { label: 'CP3',    location: '138 SW 7th St (Fairfield Inn parking)',     mile: 22,   plannedArrival: '9:30 AM', christinaArrival: '~9:38 AM',  outcome: 'missed',  summary: 'Missed (Bear\'s shoes, downtown logistics)' },
      { label: 'Finish', location: 'Scissortail Park, 701 SW 3rd St',           mile: 26.2, plannedArrival: null,      christinaArrival: '10:23:46 AM', outcome: 'partial', summary: 'Communicated to Christina; physical presence not achieved' },
    ],
    cp1HandOff: 'Original plan called for full heat package: bottle swap, mini frozen bottle, ziploc of ice, soaked sponge, iced neck towel. Plan was trimmed in real-time to bottle + ice only, on the basis that conditions at mile 11 (~67°F) didn\'t justify the heat package. Saved supplies for CP2.',
    cp3FailureComms: 'Decision tree applied: rather than burn Christina\'s focus on logistics she couldn\'t fix, communicate "we\'re at the finish" (true, they were in downtown) and let her run.',
  },
  predictions: [
    { point: 'After 5K',                  distanceMi: 3.11,  predicted: '3:50 (best case) / 3:57 (regression case)', actual: '3:50:32', deltaNotes: 'Within range' },
    { point: 'After 10K',                 distanceMi: 6.21,  predicted: '3:54',     actual: '3:50:32', delta: '+3:28' },
    { point: 'After Half',                distanceMi: 13.11, predicted: '3:50 to 3:53', actual: '3:50:32', deltaNotes: 'Within range' },
    { point: 'After 25K',                 distanceMi: 15.53, predicted: '3:48',     actual: '3:50:32', delta: '+2:32' },
    { point: 'After 30K (formal "bet")',  distanceMi: 18.64, predicted: '3:48:30',  actual: '3:50:32', delta: '+2:02', highlight: true },
    { point: 'After ~24.6 mi',            distanceMi: 24.6,  predicted: 'Within 1 second at this point', actual: 'n/a', deltaNotes: 'Held until late' },
    { point: 'After 40K',                 distanceMi: 24.85, predicted: '3:51:15',  actual: '3:50:32', delta: '−0:43' },
  ],
  predictionBet: {
    at: '30K',
    dalton: { time: '3:47:15', delta: '−3:17' },
    claude: { time: '3:48:30', delta: '−2:02' },
    actual: '3:50:32',
    winner: 'claude',
    winMargin: '1:15',
    note: 'Both underestimated the magnitude of the late-race fade.',
  },
  predictionSummary: {
    worked: [
      'Sub-4:00 confidence locked by 10K',
      '"Hits goal time" confidence locked by Half',
      'Negative-split attempt correctly predicted (she had legs for it)',
      'Late-race fade correctly identified as heat-driven, not glycogen-driven',
      'The 8:38 → 8:48 → 9:10 fade signature was caught in real-time',
    ],
    didntWork: [
      'Magnitude of late fade underestimated (predicted ~9:00 final mile, actual 9:16)',
      '2-minute positive split not predicted (heat compressed back half by ~2 min)',
      'Linear pace projection became unreliable past mile 24',
    ],
  },
  communications: {
    rules: [
      '4-8 words maximum',
      'Present tense, action verbs',
      'No pace numbers (she\'ll start chasing)',
      'No "PR" or "personal best" (raises stakes)',
      'No "be careful" / "save energy" (plants doubt)',
      'No "you can do it" (too generic)',
      'One concept per message',
    ],
    texts: [
      { stage: 'Approaching CP1',         text: 'I\'m on your right, after Starbucks' },
      { stage: 'Approaching CP1',         text: 'You\'re crushing it. Don\'t push, just flow.' },
      { stage: 'Mid-race encouragement',  text: 'Steady and focused. You finish strong.' },
      { stage: 'Approaching CP3 (drafted)', text: '138 SW 7th, north side. The hurt means it\'s working. Don\'t let go.' },
      { stage: 'When CP3 failed',         text: 'We\'re at the finish. Bring it home.' },
      { stage: 'Post-finish (planned)',   text: 'You did it!! So proud of you. Long story but Bear forgot shoes, meet us at the car when you\'re ready. You crushed it.' },
    ],
    mentalCueFramework: {
      generic:  'Don\'t walk. You can do this.',
      identity: 'This is where you wrote a different ending.',
      rationale: 'The identity frame names what she was actually fighting (the memory of last time) without instructing her body. It tells her who she is in this moment, not what to do.',
    },
  },
  provenance: [
    { source: 'MyChipTime official results',     url: 'https://www.mychiptime.com/searchevent.php?id=17142',                       usedFor: 'Final time, placement, official splits' },
    { source: 'MyChipTime bib lookup',            url: 'https://www.mychiptime.com/searchevent.php?id=17142&bib=648',               usedFor: 'All split times, paces, ToD timestamps' },
    { source: 'Garmin Connect event',             url: 'https://connect.garmin.com/modern/event/0/21726670?shareableEventUuid=802ea0b7-c7a2-4f13-805f-4f735542d958', usedFor: 'Garmin event analytics' },
    { source: 'Garmin Connect Running dashboard', url: null, artifact: 'Screenshot (Feb 2 to Apr 26 view)', usedFor: '12-week training context' },
    { source: 'FindMyMarathon tracker',           url: null, artifact: 'Live screenshots captured during race', usedFor: 'Mid-race pace reads, distance tracking, time-of-day estimates' },
    { source: 'Official course map PDF',          url: null, artifact: '2026 OKC Memorial Marathon (project file)', usedFor: 'Elevation, course shape, aid stations, closures' },
    { source: 'FindMyMarathon pace band',         url: null, artifact: 'Photo captured pre-race', usedFor: 'Goal pace plan, planned splits' },
    { source: 'Crew Punch List',                  url: null, artifact: 'christina-okc-pacing.vercel.app', usedFor: 'Checkpoint plans, hand-off supplies, driving routes' },
  ],
};

console.log(`Upserting race archive ${RACE_SLUG}/${RUNNER_SLUG}…`);
await sql`
  insert into race_archives (race_slug, runner_slug, race_name, race_date, runner_name, headline_time, data, updated_at)
  values (${RACE_SLUG}, ${RUNNER_SLUG}, ${RACE_NAME}, ${RACE_DATE}, ${RUNNER_NAME}, ${HEADLINE}, ${JSON.stringify(data)}::jsonb, now())
  on conflict (race_slug, runner_slug) do update set
    race_name     = excluded.race_name,
    race_date     = excluded.race_date,
    runner_name   = excluded.runner_name,
    headline_time = excluded.headline_time,
    data          = excluded.data,
    updated_at    = now()
`;

const [row] = await sql`
  select race_slug, runner_slug, race_name, race_date, runner_name, headline_time,
         jsonb_typeof(data) as data_type,
         jsonb_array_length(data->'officialSplits') as splits_count,
         jsonb_array_length(data->'segments') as segments_count,
         updated_at
  from race_archives
  where race_slug = ${RACE_SLUG} and runner_slug = ${RUNNER_SLUG}
`;
console.log('Archive row:', row);
console.log('Done.');
