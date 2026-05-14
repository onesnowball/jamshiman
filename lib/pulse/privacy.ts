export const K_ANONYMITY_THRESHOLD = 5

export function canShowAggregate(uniqueUserCount: number): boolean {
  return uniqueUserCount >= K_ANONYMITY_THRESHOLD
}
