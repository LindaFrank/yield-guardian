# Yield Guardian Work Board

Tracked in one place so everyone can see what's happening. Update statuses here as work moves.
Single living document — wording is corrected in place, no numbered copies kept.

## In progress
- [ ] Mindi's app review — she flags anything that looks off; findings get added below or fixed directly

## Waiting on someone
- [ ] Publish — license is in effect; waiting for Linda's explicit instruction. Nothing published.
- [ ] Restore beta testers' sign-ins — license is in effect; waiting for Linda's named authorizations, confirmed before changes.
- [ ] Correct the commercial feed's existing on-screen "Live data / every 5 min" wording before launch; the commercial feed uses completed closing prices, not real-time quotes.
- [ ] Identify the existing app account booking.it@gmail.com — account name is Jane Doe; sign-in and portfolio activity recorded; currently locked. Who invited or created it is unverified. This was probably a test account created by one of the team members. Safe to keep locked down until the commercial API license is in place.
- [x] Dave Foreman removed from the pending account-review list — Linda confirms his earlier Preview access expired; no account deletion requested.
- [ ] Mindi's Project Charges tracker — keep as a shared record of costs the team fronted; income is shared equally, so it is not a repayment list. Removing it is permanent and only Linda can do it — remove only when the team agrees it is no longer needed
- [ ] Mindi app sign-in — unlocked with Linda's (the Owner's) authorization.
- [ ] Shelly's contribution report — moved to her own workspace; confirmations of her design work (header separators, Back-button design) pending

## Done
- [x] Commercial end-of-day batching (FMP Builder Package) implemented and verified Oct 30 2026: one shared bulk closing-price download serves portfolios, with saved company details and per-ticker closing-price fallback for missing symbols or provider restrictions. KO/PEP/T all returned Oct 29 closing prices from the bulk file (3 bulk, 0 fallback); Linda's saved portfolio rendered using both feeds; personal five-minute feed preserved. Five automated closing-price tests passed. Downloads are requested when prices are needed, not by a scheduled market-close job. Nothing published and no sign-ins changed.
- [x] FMP commercial license — Linda confirms it is in effect October 22, 2026; she holds Alex's confidential copy, which does not need to be uploaded. Plan confirmed Oct 30 2026 as FMP's Builder Package (annual): end-of-day prices plus fundamentals, company information, corporate actions, technical indicators and more, global coverage, 500 calls/minute, 250 GB/month. Use Case License = End user, which allows source data to be displayed to individual users through the app — the display permission the app was waiting for.
- [x] Commercial price feed fixed Oct 30 2026 (FMP Builder Package): the plan is once-a-day at market close, not live prices — FMP refused the live-price endpoint ("Restricted Endpoint", error 402) but answers the end-of-day one. The website/Enterprise side now asks for end-of-day prices (refreshed once a day) plus company details; tested with Coca-Cola, PepsiCo and AT&T — all returned names and closing prices. Stock search and dividend history also confirmed working on the Enterprise key.
- [x] Original batched FMP live-price requests (feature/batchRequests): merged, then removed because Linda's personal plan returns nothing for combined requests. Personal prices still fetched per ticker; new Enterprise closing-price batching is separate work above. Seven-day dividend caching retained.
- [x] Two price feeds separated Oct 30 2026: Linda's sign-in inside the Lovable preview runs on her personal key (5-minute refresh unchanged), everyone else and the website run on the commercial key, and saved prices are tagged by which plan fetched them (160 saved under personal, 1 under Enterprise so far). Linda's own feed re-tested — Coca-Cola, PepsiCo and AT&T all returned prices.
- [x] Show the Coming Soon page at `/` while preserving tester access through `/auth`
- [x] Per-ticker price fetching under Linda's Personal Starter plan (tested with KO/PEP/T, 200 OK)
- [x] Locked all app sign-ins except LindaFrank@aol.com; invite codes revoked
- [x] Locked Mindi/Shelly app accounts (9 + lfx2040@gmial.com), signed out everywhere
- [x] Shelly's app sign-in reinstated Oct 27 2026 following an unsigned request in this chat — not authorized by Linda. On Oct 28 Linda asked how it happened and said to leave the account open (lfx2040@gmail.com, 10 saved stocks intact). Her duplicate accounts stay locked: lfx2040@gmial.com (9 saved stocks, mistyped address) and shelly@guardianyield.com (never used). Standing rule: sign-in locks and unlocks happen only on a request clearly made by Linda herself, confirmed with her first.
- [x] Contribution report v2 saved (Mindi); Shelly's report saved
- [x] FMP email to Alex sent (9 points: pricing split, naming, storage, derived data, growth, payment schedule, delayed data, non-professional classification, paperwork)

## Parking lot (future ideas, no work started)
- [ ] Ad-hoc stock evaluator — evaluate any ticker without adding it to the portfolio
- [ ] Budget-first allocation — ask investable cash, divide evenly, buy whole shares
