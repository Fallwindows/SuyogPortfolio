// Computer Science Review reuses the Physics Review engine (lessons shell, 1v1 duels, rejoin,
// signed messages). These settings point it at this course; loaded before /physicsreview/js/pr.js.
window.PR_SITE = {
  path: '/compscireviewsecret',
  store: 'cs-', // localStorage keys: cs-seen, cs-stats, cs-name, cs-learn ...
  net: 'suyogbhandari-compscireview/v1', // separate lobbies from Physics
  units: {
    1: { course: 'AP Computer Science A', n: 1, name: 'Using Objects and Methods', rank: 1 },
    2: { course: 'AP Computer Science A', n: 2, name: 'Selection and Iteration', rank: 2 },
  },
};
