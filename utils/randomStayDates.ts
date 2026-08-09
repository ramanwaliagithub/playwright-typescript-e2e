/**
 * Picks a random date 30-330 days out (checkout = checkin + 1 day). RBP's hosted instance is
 * real, shared, stateful data — a hardcoded date collides with whatever a previous test run
 * already booked for that exact day. Randomizing avoids that instead of hardcoding a "safe"
 * date that inevitably stops being safe.
 */
export function randomStayDates(): { checkin: Date; checkout: Date } {
  const daysOut = 30 + Math.floor(Math.random() * 300);
  const checkin = new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
  const checkout = new Date(checkin.getTime() + 24 * 60 * 60 * 1000);
  return { checkin, checkout };
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
