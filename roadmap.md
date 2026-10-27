# Yield Guardian Work Board

Tracked in one place so everyone can see what's happening. Update statuses here as work moves.
Single living document — wording is corrected in place, no numbered copies kept.

## In progress
- [ ] Mindi's app review — she flags anything that looks off; findings get added below or fixed directly

## Waiting on someone
- [ ] FMP commercial licence — Alex's reply to the 9-point email is pending (Linda)
- [ ] Turn on live data feed / publish — blocked until the licence is signed (Linda gives the word)
- [ ] Restore beta testers' sign-ins — waiting for the commercial API license from FMP
- [ ] Identify the existing app account booking.it@gmail.com — account name is Jane Doe; sign-in and portfolio activity recorded; currently locked. Who invited or created it is unverified. This was probably a test account created by one of the team members. Safe to keep locked down until the commercial API license is in place.
- [x] Dave Foreman removed from the pending account-review list — Linda confirms his earlier Preview access expired; no account deletion requested.
- [ ] Mindi's Project Charges tracker — keep as a shared record of costs the team fronted; income is shared equally, so it is not a repayment list. Removing it is permanent and only Linda can do it — remove only when the team agrees it is no longer needed
- [ ] Mindi app sign-in — unlocked with Linda's (the Owner's) authorization.
- [ ] Shelly's contribution report — moved to her own workspace; confirmations of her design work (header separators, Back-button design) pending

## Done
- [x] Batched FMP ticker requests (feature/batchRequests): quotes batched 50/chunk, dividends cached 7 days via dividends_cached_at — merged, then batching removed Oct 2026 because Linda's personal FMP plan returns nothing for combined requests; prices now fetched one ticker per request
- [x] Show the Coming Soon page at `/` while preserving tester access through `/auth`
- [x] Per-ticker price fetching under Linda's Personal Starter plan (tested with KO/PEP/T, 200 OK)
- [x] Locked all app sign-ins except LindaFrank@aol.com; invite codes revoked
- [x] Locked Mindi/Shelly app accounts (9 + lfx2040@gmial.com), signed out everywhere
- [x] Shelly's app sign-in reinstated Oct 27 2026 on Linda's authorization (lfx2040@gmail.com, 10 saved stocks intact). Her duplicate accounts stay locked: lfx2040@gmial.com (9 saved stocks, mistyped address) and shelly@guardianyield.com (never used).
- [x] Contribution report v2 saved (Mindi); Shelly's report saved
- [x] FMP email to Alex sent (9 points: pricing split, naming, storage, derived data, growth, payment schedule, delayed data, non-professional classification, paperwork)

## Parking lot (future ideas, no work started)
- [ ] Ad-hoc stock evaluator — evaluate any ticker without adding it to the portfolio
- [ ] Budget-first allocation — ask investable cash, divide evenly, buy whole shares
