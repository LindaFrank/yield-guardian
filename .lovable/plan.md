# Top-right Back button

## Changes
- Add one shared teal Back button outside the page layouts so it appears on every route.
- Fix it directly to the browser’s top-right edge with the highest practical stacking order and no page margin.
- Remove any page-specific Back button duplication if present.

## Verification
- Check representative signed-out pages at desktop and mobile widths.
- Confirm the button remains visible at the top-right while scrolling and does not overlap page controls.
