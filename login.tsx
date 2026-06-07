// Pregnancy squat coach rules + pose analysis helpers.
// Adapted from teamFour main repo (ACOG / Healthline guidance).

export const STOP_SIGNS = [
  "dizziness",
  "pain",
  "vaginal bleeding",
  "shortness of breath",
  "racing heartbeat",
  "chest pain",
  "vaginal fluid leaking",
  "uterine contractions",
  "muscle cramps",
] as const;

export const STOP_SIGNS_SENTENCE =
  "Stop immediately and contact your healthcare provider if you experience " +
  "dizziness, pain, vaginal bleeding, shortness of breath, racing heartbeat, " +
  "chest pain, vaginal fluid leaking, uterine contractions, or muscle cramps.";

export type Trimester = 1 | 2 | 3;
export type Variation = "bodyweight" | "sumo" | "chair";

export const TRIMESTER_RULES: Record<Trimester, any> = {
  1: { minKnee: 90, maxKnee: 130, stanceMultiplier: 1.0, breathInterval: 30000 },
  2: { minKnee: 100, maxKnee: 130, stanceMultiplier: 1.2, breathInterval: 25000 },
  3: { minKnee: 110, maxKnee: 140, stanceMultiplier: 1.4, breathInterval: 20000 },
};

export const VARIATION_RULES: Record<Variation, any> = {
  bodyweight: { stanceMultiplier: 1.0 },
  sumo: { stanceMultiplier: 1.5, requireToesOut: true },
  chair: { minKnee: 100, maxKnee: 130 },
};

export function getRules(trimester: Trimester, variation: Variation) {
  return {
    ...TRIMESTER_RULES[trimester],
    ...VARIATION_RULES[variation],
  };
}

export const VARIATION_LABELS: Record<Variation, string> = {
  bodyweight: "Bodyweight",
  sumo: "Sumo",
  chair: "Chair-supported",
};

export const PREGNANCY_PHRASES: Record<string, string> = {
  widen_stance: "Try widening your stance a bit for better balance",
  narrow_stance:
    "Bring your feet in a little, a narrower stance is easier on your hips",
  knees_over_toes:
    "Keep your weight in your heels, your knees are going past your toes",
  back_straight: "Keep your back nice and straight, lift through your chest",
  too_deep: "That's deep enough, no need to go further",
  good_depth: "Beautiful depth, perfect for you",
  knees_caving: "Gently press your knees outward, track them over your toes",
  chest_up: "Lift tall through your chest, take your time",
  remember_to_breathe: "Steady breathing, don't hold your breath",
  squeeze_glutes: "Squeeze your glutes as you stand up",
  good_form: "You're doing amazing",
};

export const CUE_PRIORITY = [
  "knees_over_toes",
  "back_straight",
  "knees_caving",
  "narrow_stance",
  "widen_stance",
  "chest_up",
  "too_deep",
  "good_depth",
  "remember_to_breathe",
  "squeeze_glutes",
  "good_form",
];

export const CRITICAL_CUES = new Set(["knees_over_toes", "back_straight"]);
export const ADJUST_CUES = new Set([
  "knees_caving",
  "widen_stance",
  "narrow_stance",
  "chest_up",
  "too_deep",
]);

export const STATUS_COLORS = {
  good: "#00e676",
  adjust: "#ffea00",
  stop: "#ff1744",
} as const;

export const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_FOOT: 31,
  RIGHT_FOOT: 32,
};

export const STANDING_ANGLE = 160;
const KNEE_OVER_TOES_THRESHOLD = 0.05;
const BACK_LEAN_RATIO = 0.35;
const STANCE_MIN_RATIO = 0.9;
const STANCE_MAX_RATIO = 1.3;
const KNEE_DIVERGENCE = 10;
const FORWARD_LEAN_HIP_ANGLE = 30;
const GLUTE_ASCENT_ANGLE = 130;
const MIN_VISIBILITY = 0.5;

type Pt = { x: number; y: number; visibility?: number };

export function getAngle(a: Pt, b: Pt, c: Pt) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
}

const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function kneeForwardTravel(knee: Pt, ankle: Pt, toe: Pt) {
  const forward = Math.sign(toe.x - ankle.x) || 1;
  return (knee.x - ankle.x) * forward;
}

export function bodyVisible(lm: Pt[]) {
  return [
    LM.LEFT_HIP,
    LM.RIGHT_HIP,
    LM.LEFT_KNEE,
    LM.RIGHT_KNEE,
    LM.LEFT_ANKLE,
    LM.RIGHT_ANKLE,
  ].every((i) => (lm[i]?.visibility ?? 1) > MIN_VISIBILITY);
}

export function getPoseMetrics(lm: Pt[]) {
  const leftKnee = getAngle(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]);
  const rightKnee = getAngle(
    lm[LM.RIGHT_HIP],
    lm[LM.RIGHT_KNEE],
    lm[LM.RIGHT_ANKLE]
  );
  const avgKnee = (leftKnee + rightKnee) / 2;

  const leftHip = getAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE]);
  const rightHip = getAngle(
    lm[LM.RIGHT_SHOULDER],
    lm[LM.RIGHT_HIP],
    lm[LM.RIGHT_KNEE]
  );
  const hipAngle = (leftHip + rightHip) / 2;

  const shoulderWidth = Math.abs(
    lm[LM.LEFT_SHOULDER].x - lm[LM.RIGHT_SHOULDER].x
  );
  const ankleWidth = Math.abs(lm[LM.LEFT_ANKLE].x - lm[LM.RIGHT_ANKLE].x);
  const kneeWidth = Math.abs(lm[LM.LEFT_KNEE].x - lm[LM.RIGHT_KNEE].x);

  const shoulderMid = mid(lm[LM.LEFT_SHOULDER], lm[LM.RIGHT_SHOULDER]);
  const hipMid = mid(lm[LM.LEFT_HIP], lm[LM.RIGHT_HIP]);
  const torsoLen = dist(shoulderMid, hipMid) || 1e-6;
  const leanRatio = Math.abs(shoulderMid.x - hipMid.x) / torsoLen;

  const leftTravel = kneeForwardTravel(
    lm[LM.LEFT_KNEE],
    lm[LM.LEFT_ANKLE],
    lm[LM.LEFT_FOOT]
  );
  const rightTravel = kneeForwardTravel(
    lm[LM.RIGHT_KNEE],
    lm[LM.RIGHT_ANKLE],
    lm[LM.RIGHT_FOOT]
  );
  const kneeOverToes = Math.max(leftTravel, rightTravel);

  return {
    leftKnee,
    rightKnee,
    avgKnee,
    hipAngle,
    shoulderWidth,
    ankleWidth,
    kneeWidth,
    leanRatio,
    kneeOverToes,
    inSquat: avgKnee < STANDING_ANGLE,
  };
}

export function getFormCues(
  metrics: ReturnType<typeof getPoseMetrics>,
  rules: any,
  prevKnee: number | null = null
) {
  const cues: string[] = [];
  const {
    avgKnee,
    hipAngle,
    leftKnee,
    rightKnee,
    shoulderWidth,
    ankleWidth,
    leanRatio,
    kneeOverToes,
    inSquat,
  } = metrics;

  const targetStance = shoulderWidth * (rules.stanceMultiplier ?? 1);
  if (ankleWidth < targetStance * STANCE_MIN_RATIO) cues.push("widen_stance");
  else if (ankleWidth > targetStance * STANCE_MAX_RATIO) cues.push("narrow_stance");

  if (inSquat) {
    if (kneeOverToes > KNEE_OVER_TOES_THRESHOLD) cues.push("knees_over_toes");
    if (leanRatio > BACK_LEAN_RATIO) cues.push("back_straight");
    if (Math.abs(leftKnee - rightKnee) > KNEE_DIVERGENCE) cues.push("knees_caving");
    if (hipAngle < FORWARD_LEAN_HIP_ANGLE) cues.push("chest_up");

    if (avgKnee < rules.minKnee) cues.push("too_deep");
    else if (avgKnee <= rules.maxKnee) cues.push("good_depth");

    cues.push("good_form");
  }

  if (
    prevKnee != null &&
    avgKnee > prevKnee + 1 &&
    prevKnee <= GLUTE_ASCENT_ANGLE &&
    avgKnee > GLUTE_ASCENT_ANGLE
  ) {
    cues.push("squeeze_glutes");
  }

  return cues;
}

export function pickCue(cues: string[]) {
  for (const key of CUE_PRIORITY) {
    if (cues.includes(key)) return key;
  }
  return null;
}

export function statusFromCues(cues: string[]): "good" | "adjust" | "stop" {
  if (cues.some((c) => CRITICAL_CUES.has(c))) return "stop";
  if (cues.some((c) => ADJUST_CUES.has(c))) return "adjust";
  return "good";
}
