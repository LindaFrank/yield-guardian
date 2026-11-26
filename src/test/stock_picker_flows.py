"""Live-preview regression checks; run with python3 src/test/stock_picker_flows.py."""
import asyncio
import os
from playwright.async_api import async_playwright, expect


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 714, "height": 646})
        await page.goto(os.environ.get("APP_TEST_URL", "http://localhost:8080") + "/try")
        await page.locator("#invest-budget-input").fill("4500")

        # A filled calculator must not redirect the target-yield action or prefill shares.
        await page.get_by_role("button", name="Stocks that meet Yield Target", exact=True).click()
        dialog = page.get_by_role("dialog")
        await expect(dialog.get_by_role("heading", name="Matching Stocks", exact=True)).to_be_visible()
        await dialog.get_by_role("checkbox").first.check()
        shares = dialog.get_by_placeholder("Shares", exact=True)
        await expect(shares).to_have_value("")
        await shares.fill("100")
        await expect(shares).to_have_value("100")
        await dialog.get_by_role("button", name="Back to Portfolio", exact=True).click()
        await expect(dialog).not_to_be_visible()
        print("PASS: Target-yield matching leaves shares blank and accepts manual entry with a $4,500 budget present.")

        # Inline manual setup must also remain independent of the calculator.
        await page.get_by_role("checkbox").first.check()
        await page.get_by_role("button", name="Enter Shares", exact=False).click()
        await expect(page.get_by_placeholder("Shares", exact=True)).to_have_value("")
        print("PASS: Inline stock selection keeps share counts blank despite a filled calculator.")

        # Only the dedicated budget button opens the allocator and prefills editable shares.
        await page.get_by_role("button", name="Find stocks for this amount", exact=True).click()
        dialog = page.get_by_role("dialog")
        await dialog.get_by_role("checkbox").first.check()
        await dialog.get_by_role("button", name="Enter Shares", exact=False).click()
        shares = dialog.get_by_placeholder("Shares", exact=True)
        await expect(shares).not_to_have_value("")
        assert int(await shares.input_value()) > 0, "The calculator must allocate whole shares."
        await shares.fill("10")
        await expect(shares).to_have_value("10")
        print("PASS: The budget button still prefills whole shares and lets the user edit them.")
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())