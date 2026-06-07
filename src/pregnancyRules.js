// =============================================================================
// pregnancyRules.js
//
// Medically-grounded rule tables + pure pose-analysis helpers for the
// pregnancy squat coach. Everything here is framework-free and side-effect
// free so it can be reasoned about (and unit-tested) on its own.
//
// Guidance is grounded in ACOG ("Exercise During Pregnancy") and Healthline's
// medically-reviewed prenatal-squat articles: keep weight in the heels, never
// push depth, watch for knee valgus (joint laxity from relaxin), and stop at
// the first warning sign.
// =============================================================================

// --- Stop signs (verbatim ACOG/Healthline warning list) ---------------------

export const STOP_SIGNS = [
  'dizziness',
  'pain',
  'vaginal bleeding',
  'shortness of breath',
  'racing heartbeat',
  'chest pain',
  'vaginal fluid leaking',
  'uterine contractions',
  'muscle cramps',
]

export const STOP_SIGNS_SENTENCE =
  'Stop immediately and contact your healthcare provider if you experience ' +
  'dizziness, pain, vaginal bleeding, shortness of breath, racing heartbeat, ' +
  'chest pain, vaginal fluid leaking, uterine contractions, or muscle cramps.'

// --- Rule tables ------------------------------------------------------------

// Knee angle is measured hip-knee-ankle: ~180° standing, smaller = deeper.
// minKnee is the *deepest allowed* angle (go below it = too deep).
// maxKnee is the shallow end of the "good depth" window.
export const TRIMESTER_RULES = {
  1: { minKnee: 90,  maxKnee: 130, stanceMultiplier: 1.0, breathInterval: 30000 },
  2: { minKnee: 100, maxKnee: 130, stanceMultiplier: 1.2, breathInterval: 25000 },
  3: { minKnee: 110, maxKnee: 140, stanceMultiplier: 1.4, breathInterval: 20000 },
}

export const VARIATION_RULES = {
  bodyweight: { stanceMultiplier: 1.0 },                  // shoulder-width
  sumo:       { stanceMultiplier: 1.5, requireToesOut: true },
  chair:      { minKnee: 100, maxKnee: 130 },             // chair stops the descent
}

// Variation rules are applied *on top of* trimester rules (shallow merge,
// variation keys win). e.g. chair always uses its own 100/130 depth window
// regardless of trimester; sumo always uses its wider 1.5 stance.
export function getRules(trimester, variation) {
  return {
    ...TRIMESTER_RULES[trimester],
    ...VARIATION_RULES[variation],
  }
}

export const VARIATION_LABELS = {
  bodyweight: 'Bodyweight',
  sumo:       'Sumo',
  chair:      'Chair-supported',
}

// --- Audio phrase bank (pre-cached at session start) ------------------------

export const PREGNANCY_PHRASES = {
  widen_stance:        'Try widening your stance a bit for better balance',
  knees_over_toes:     'Keep your weight in your heels, your knees are going past your toes',
  back_straight:       'Keep your back nice and straight, lift through your chest',
  too_deep:            "That's deep enough, no need to go further",
  good_depth:          'Beautiful depth, perfect for you',
  knees_caving:        'Gently press your knees outward, track them over your toes',
  chest_up:            'Lift tall through your chest, take your time',
  remember_to_breathe: "Steady breathing, don't hold your breath",
  squeeze_glutes:      'Squeeze your glutes as you stand up',
  rest_break:          'Great work, take a break, hydrate, and come back when ready',
  good_form:           "You're doing amazing",
}

// --- Cue priority + severity ------------------------------------------------

// Highest priority first. Only one cue is spoken per opportunity.
//   "depth"  -> too_deep / good_depth
//   "breath" -> remember_to_breathe
//   "glutes" -> squeeze_glutes
export const CUE_PRIORITY = [
  'knees_over_toes',
  'back_straight',
  'knees_caving',
  'widen_stance',
  'chest_up',
  'too_deep',
  'good_depth',
  'remember_to_breathe',
  'squeeze_glutes',
  'good_form',
]

// Drives the skeleton color: red (stop/critical) > yellow (adjust) > green.
export const CRITICAL_CUES = new Set(['knees_over_toes', 'back_straight'])
export const ADJUST_CUES = new Set([
  'knees_caving',
  'widen_stance',
  'chest_up',
  'too_deep',
])

export const STATUS_COLORS = {
  good:   '#00e676', // green
  adjust: '#ffea00', // yellow
  stop:   '#ff1744', // red
}

// --- Landmark indices + tunable thresholds ----------------------------------

export const LM = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,      RIGHT_HIP: 24,
  LEFT_KNEE: 25,     RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,    RIGHT_ANKLE: 28,
  LEFT_FOOT: 31,     RIGHT_FOOT: 32,
}

export const STANDING_ANGLE = 160          // knee angle above this = standing
const KNEE_OVER_TOES_THRESHOLD = 0.05      // normalized x: knee past toe
const BACK_LEAN_RATIO = 0.35               // shoulder-vs-hip horizontal offset / torso length
const STANCE_TOLERANCE = 0.9               // ankle width must reach 90% of target
const KNEE_DIVERGENCE = 10                 // deg; stricter than 15 due to relaxin
const FORWARD_LEAN_HIP_ANGLE = 30          // hip angle below this = relaxed forward-lean flag
const GLUTE_ASCENT_ANGLE = 130             // cue glutes when rising past this
const MIN_VISIBILITY = 0.5

// --- Pure math helpers ------------------------------------------------------

export function getAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs(radians * (180 / Math.PI))
  if (angle > 180) angle = 360 - angle
  return angle
}

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// Forward travel of the knee past the toe. Foot index gives the "forward"
// direction so this works whichever way the user is angled to the camera.
function kneeForwardTravel(knee, ankle, toe) {
  const forward = Math.sign(toe.x - ankle.x) || 1
  return (knee.x - ankle.x) * forward
}

// --- Pose evaluation --------------------------------------------------------

// Returns true only when the core lower-body landmarks are confidently tracked,
// so we don't coach on garbage data when the user is out of frame.
export function bodyVisible(lm) {
  return [LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_ANKLE, LM.RIGHT_ANKLE]
    .every((i) => (lm[i]?.visibility ?? 1) > MIN_VISIBILITY)
}

export function getPoseMetrics(lm) {
  const leftKnee = getAngle(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE])
  const rightKnee = getAngle(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE])
  const avgKnee = (leftKnee + rightKnee) / 2

  const leftHip = getAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE])
  const rightHip = getAngle(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE])
  const hipAngle = (leftHip + rightHip) / 2

  const shoulderWidth = Math.abs(lm[LM.LEFT_SHOULDER].x - lm[LM.RIGHT_SHOULDER].x)
  const ankleWidth = Math.abs(lm[LM.LEFT_ANKLE].x - lm[LM.RIGHT_ANKLE].x)
  const kneeWidth = Math.abs(lm[LM.LEFT_KNEE].x - lm[LM.RIGHT_KNEE].x)

  // Back-straight signal: how far the shoulders sit in front of the hips,
  // normalized by torso length (curling forward pushes this up).
  const shoulderMid = mid(lm[LM.LEFT_SHOULDER], lm[LM.RIGHT_SHOULDER])
  const hipMid = mid(lm[LM.LEFT_HIP], lm[LM.RIGHT_HIP])
  const torsoLen = dist(shoulderMid, hipMid) || 1e-6
  const leanRatio = Math.abs(shoulderMid.x - hipMid.x) / torsoLen

  // Knees-over-toes: the worst (most forward) of the two legs.
  const leftTravel = kneeForwardTravel(lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE], lm[LM.LEFT_FOOT])
  const rightTravel = kneeForwardTravel(lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE], lm[LM.RIGHT_FOOT])
  const kneeOverToes = Math.max(leftTravel, rightTravel)

  return {
    leftKnee, rightKnee, avgKnee, hipAngle,
    shoulderWidth, ankleWidth, kneeWidth,
    leanRatio, kneeOverToes,
    inSquat: avgKnee < STANDING_ANGLE,
  }
}

// Returns every cue that currently applies (unordered). `prevKnee` enables the
// ascending-phase glute cue; pass null on the first frame.
export function getFormCues(metrics, rules, prevKnee = null) {
  const cues = []
  const {
    avgKnee, hipAngle, leftKnee, rightKnee,
    shoulderWidth, ankleWidth, leanRatio, kneeOverToes, inSquat,
  } = metrics

  // Stance width — useful while standing too, so it's checked every frame.
  const targetStance = shoulderWidth * (rules.stanceMultiplier ?? 1)
  if (ankleWidth < targetStance * STANCE_TOLERANCE) cues.push('widen_stance')

  if (inSquat) {
    // Most important rule per Healthline: knees drifting past the toes.
    if (kneeOverToes > KNEE_OVER_TOES_THRESHOLD) cues.push('knees_over_toes')
    if (leanRatio > BACK_LEAN_RATIO) cues.push('back_straight')
    if (Math.abs(leftKnee - rightKnee) > KNEE_DIVERGENCE) cues.push('knees_caving')
    if (hipAngle < FORWARD_LEAN_HIP_ANGLE) cues.push('chest_up')

    // Depth — only ever flag too deep, never push them lower.
    if (avgKnee < rules.minKnee) cues.push('too_deep')
    else if (avgKnee <= rules.maxKnee) cues.push('good_depth')

    // Encouragement fallback when nothing is wrong.
    cues.push('good_form')
  }

  // Glute squeeze on the way up, as the knees rise past the threshold.
  if (
    prevKnee != null &&
    avgKnee > prevKnee + 1 &&
    prevKnee <= GLUTE_ASCENT_ANGLE &&
    avgKnee > GLUTE_ASCENT_ANGLE
  ) {
    cues.push('squeeze_glutes')
  }

  return cues
}

// Picks the single highest-priority cue from a list of active cues.
export function pickCue(cues) {
  for (const key of CUE_PRIORITY) {
    if (cues.includes(key)) return key
  }
  return null
}

// Maps the active cues to a skeleton color bucket.
export function statusFromCues(cues) {
  if (cues.some((c) => CRITICAL_CUES.has(c))) return 'stop'
  if (cues.some((c) => ADJUST_CUES.has(c))) return 'adjust'
  return 'good'
}
