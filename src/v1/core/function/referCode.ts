interface ReferralCodeOptions {
  userId: number;
}

interface ReferralCodeResult {
  code: string;
}

// Generate referral code function
export function generateReferralCode({ userId }: ReferralCodeOptions): ReferralCodeResult {
  const base36Id = userId.toString(36); // encodes to alphanumeric
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const randomLength = 8 - base36Id.length;
  let randomPart = '';

  for (let i = 0; i < randomLength; i++) {
    const randIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randIndex];
  }

  // Combine and shuffle the characters to make it less predictable
  const rawCode = base36Id + randomPart;
  const shuffled = rawCode
    .split('')
    .sort(() => 0.5 - Math.random()) // basic shuffle
    .join('')
    .slice(0, 8); // ensure exactly 8 characters

  return { code: shuffled };
}

