// Curated medically-grounded Q&A for the between-sets voice assistant.
// Adapted from teamFour main repo.

const FAQ = [
  {
    id: "depth",
    keywords: ["deep", "depth", "how low", "how far", "lower", "bottom", "far down"],
    answer:
      "Squat only as deep as feels comfortable, around the height of sitting back to a chair. There is no need to go lower, especially as your pregnancy progresses.",
  },
  {
    id: "safety",
    keywords: ["safe", "okay", "allowed", "dangerous", "harm", "risky", "is it ok"],
    answer:
      "Squats are generally considered safe in a healthy pregnancy when your provider has cleared you to exercise. Stop and check in with them if anything feels off.",
  },
  {
    id: "reps",
    keywords: ["how many", "reps", "sets", "how much", "repetitions", "count"],
    answer:
      "Aim for about three sets of ten to fifteen reps, resting whenever you need to. Quality matters far more than quantity.",
  },
  {
    id: "breathing",
    keywords: ["breathe", "breathing", "breath", "hold my breath", "exhale", "inhale"],
    answer:
      "Keep your breathing steady. Exhale as you stand up, and never hold your breath while squatting.",
  },
  {
    id: "stance",
    keywords: ["stance", "feet", "wide", "narrow", "foot", "how wide", "toes"],
    answer:
      "Stand about shoulder width apart, or a little wider, with your toes turned slightly out. Avoid going so wide that it strains your hips.",
  },
  {
    id: "knees",
    keywords: ["knee", "knees", "knee pain", "knee hurt"],
    answer:
      "Keep your weight in your heels and let your knees track over your toes, not past them. If your knees hurt, ease up and use a smaller range.",
  },
  {
    id: "back",
    keywords: ["back", "spine", "posture", "rounding", "lean", "back hurt", "back pain"],
    answer:
      "Lift tall through your chest and keep your back straight instead of rounding forward. If your back aches, reduce how deep you go.",
  },
  {
    id: "stop_signs",
    keywords: [
      "stop", "warning", "wrong", "dizzy", "dizziness", "bleeding", "pain", "hurt",
      "contraction", "contractions", "cramp", "chest", "short of breath", "bad",
    ],
    answer:
      "Stop right away and contact your provider if you feel dizziness, pain, vaginal bleeding, shortness of breath, a racing heartbeat, chest pain, fluid leaking, contractions, or muscle cramps.",
  },
  {
    id: "trimester",
    keywords: ["trimester", "belly", "far along", "third", "second", "first", "later", "progress"],
    answer:
      "As you progress, widen your stance a touch for balance, squat a little less deep, and feel free to use a chair for support.",
  },
  {
    id: "benefits",
    keywords: ["benefit", "benefits", "why", "good for", "help", "labor", "labour", "delivery", "pelvic floor", "point"],
    answer:
      "Squats strengthen your legs, glutes, and pelvic floor, support good posture, and can help prepare your body for labor.",
  },
  {
    id: "pelvic",
    keywords: ["pelvic", "pelvis", "hip pain", "groin", "hips hurt"],
    answer:
      "If you feel pelvic or groin pain, bring your feet a little closer together and reduce your depth. If it continues, stop and check with your provider.",
  },
  {
    id: "support",
    keywords: ["chair", "support", "balance", "hold on", "wall", "falling"],
    answer:
      "Using a sturdy chair behind you, or a wall for balance, is a great idea, especially later in pregnancy.",
  },
  {
    id: "rest",
    keywords: ["water", "hydrate", "drink", "tired", "rest", "break", "exhausted"],
    answer:
      "Take your time, sip some water, and rest between sets whenever you need to.",
  },
];

const FALLBACK_ANSWER =
  "I can help with squat depth, stance, breathing, reps, your knees or back, and when to stop. For anything medical, please check with your healthcare provider.";

export function matchFaq(transcript: string) {
  const q = (transcript || "").toLowerCase();
  let best: (typeof FAQ)[number] | null = null;
  let bestScore = 0;

  for (const item of FAQ) {
    const score = item.keywords.reduce((s, k) => (q.includes(k) ? s + 1 : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best && bestScore > 0
    ? { answer: best.answer, id: best.id }
    : { answer: FALLBACK_ANSWER, id: "fallback" };
}
