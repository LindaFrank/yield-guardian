/**
 * When a search finds a stock the person already owns, the app hides it from the
 * results so it can't be added twice. That used to look like a broken search, so
 * the message now names the stock instead of blaming the price feed.
 */
export function ownedStocksMessage(symbols: string[]): string {
  const names = symbols.map((s) => s.toUpperCase());
  if (names.length === 0) return '';

  const shown = names.slice(0, 3);
  const extra = names.length - shown.length;
  const list =
    extra > 0
      ? `${shown.join(', ')} and ${extra} more`
      : shown.length === 2
        ? `${shown[0]} and ${shown[1]}`
        : shown.join(', ');

  return `${list} ${names.length === 1 ? 'is' : 'are'} already in your portfolio.`;
}
