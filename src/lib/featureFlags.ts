/**
 * Live market data switch. When false, the app never calls the stock-data
 * backend function, so no FMP requests are made from this build.
 * Branch-scoped: the backend function itself is shared by every branch/publish.
 */
export const LIVE_STOCK_DATA_ENABLED = true;
