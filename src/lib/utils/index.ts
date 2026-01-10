export { cn } from './cn';

// Random encouraging micro-copy for task completion
const completionMessages = [
  "Nice!",
  "Crushed it!",
  "One down!",
  "Easy!",
  "You did it!",
  "Boom!",
  "Nailed it!",
  "Look at you go!",
  "That's the way!",
  "Keep rolling!",
];

export function getRandomCompletionMessage(): string {
  return completionMessages[Math.floor(Math.random() * completionMessages.length)];
}

// Greeting based on time of day
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
