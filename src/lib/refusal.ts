export function isRefusal(text: string): boolean {
  return /cannot|can't|can not|don't have|do not have|no access|not able|unable|proprietary|no (publicly )?available|fabricat/i.test(text);
}
