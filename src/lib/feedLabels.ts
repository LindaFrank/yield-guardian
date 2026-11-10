/**
 * Which price feed answered the request decides what the app is allowed to say.
 *
 * - personal   = Linda's own sign-in inside the Lovable preview; real-time
 *                quotes, refreshed every 5 minutes.
 * - commercial = everyone else and the public site; the last completed
 *                trading day's closing prices, refreshed once a day.
 *
 * Default is the commercial wording: it is the accurate claim for anyone we
 * have not positively identified as the personal-feed user, so a missing
 * signal can never promise live prices to the public.
 */

export type FeedSource = 'personal' | 'commercial' | null;

export interface FeedLabels {
  fetching: string;
  ready: string;
  waiting: string;
  tooltip: string;
  toastTitle: string;
  toastDescription: string;
  errorTitle: string;
}

const PERSONAL: FeedLabels = {
  fetching: 'Fetching live market data…',
  ready: 'Live data · Refreshes every 5 min',
  waiting: 'Waiting for live feed…',
  tooltip: 'Market data is refreshed automatically every few minutes.',
  toastTitle: '📡 Live feed active!',
  toastDescription:
    'Real-time quotes from FMP are now flowing. Data refreshes every 5 min.',
  errorTitle: 'Live data unavailable',
};

const COMMERCIAL: FeedLabels = {
  fetching: 'Fetching closing prices…',
  ready: 'Closing prices · Updated once a day after market close',
  waiting: 'Waiting for closing prices…',
  tooltip:
    "Prices shown are the last completed trading day's closing prices, updated once a day after the market closes.",
  toastTitle: '📡 Price feed active!',
  toastDescription:
    'Closing prices from FMP are now flowing. Prices update once a day after market close.',
  errorTitle: 'Price data unavailable',
};

export function feedLabels(feed: FeedSource): FeedLabels {
  return feed === 'personal' ? PERSONAL : COMMERCIAL;
}
