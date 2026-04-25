export const QUOTES = {
  SUCCESS: [
    "I'm sorry, Dave. I'm afraid I *can* do that. Surgery complete.", // 2001
    "Everything is shiny, Cap'n. Code deployed.", // Firefly
    "It's a trap! ...wait, no, it's just a very clean function.", // Star Wars
    '60% of the time, it works every time.', // Anchorman (The 'Modern' Classic)
    'Logic is the beginning of wisdom, not the end.', // Spock
    'I have a cunning plan...', // Blackadder
    'Engage! The codebase is now compliant.', // Star Trek
    "The flux capacitor is at 1.21 Gigawatts. If you're gonna split this file, do it with style.", // Back to the Future
    'This is your last chance. After this, there is no turning back. You take the blue pill—the story ends. You take the red pill—you stay in Wonderland, and I show you how deep the code-hole goes.', // The Matrix
    "I'm a leaf on the wind, watch how I— [FILE SPLIT SUCCESSFUL]", // Firefly
  ],
  FAILURE: [
    'I find your lack of indentation disturbing.', // Vader
    "I'm a doctor, Jim, not a garbage collector! Fix this bloat.", // McCoy
    'Non-compliance detected. YOU SHALL NOT PASS (the 700-line limit)!', // Gandalf
    "That's no moon... that's a 1,500-line file. Rejecting.", // Star Wars
    'Game over, man! Game over! The JSON is malformed.', // Aliens
    'Error 404: Your logic has been assimilated. Resistance is futile.', // Borg
    "I've seen things you people wouldn't believe... but this code? This is a nightmare.", // Blade Runner
  ],
  RECOVERY: [
    'Re-routing power to the forward shields. Memory purged.', // Star Trek
    'Have you tried turning it off and on again?', // IT Crowd
    "Great Scott! We're going back to the project skeleton.", // Back to the Future
    "Don't panic. And always know where your towel (and backup) is.", // Hitchhiker's Guide
  ],
};

export const getRandomQuote = (category) => {
  const list = QUOTES[category];
  return list[Math.floor(Math.random() * list.length)];
};
