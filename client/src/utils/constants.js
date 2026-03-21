export const BADGE_LEVELS = [
  { name: "Newbie", minPoints: 0, icon: "🌱" },
  { name: "Explorer", minPoints: 20, icon: "🧭" },
  { name: "Achiever", minPoints: 40, icon: "🎯" },
  { name: "Specialist", minPoints: 60, icon: "🔧" },
  { name: "Expert", minPoints: 80, icon: "💡" },
  { name: "Master", minPoints: 100, icon: "🏆" },
];

export function getBadge(points) {
  return [...BADGE_LEVELS].reverse().find((b) => points >= b.minPoints);
}

export function getNextBadge(points) {
  return BADGE_LEVELS.find((b) => b.minPoints > points) || null;
}
