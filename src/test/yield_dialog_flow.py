"""Check yield selection carries between the yield and investment pop-ups."""
import asyncio
import os
from playwright.async_api import async_playwright, expect


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 714, "height": 646})
        await page.goto(os.environ.get("APP_TEST_URL", "http://localhost:8080") + "/try")
        await page.get_by_role("button", name="Desired Dividend Yield", exact=True).click()
        dialog = page.get_by_role("dialog")
        slider = dialog.get_by_role("slider")
        await slider.focus()
        await slider.press("ArrowRight")
        await slider.press("ArrowRight")
        await expect(slider).to_have_attribute("aria-valuenow", "6")
        await dialog.get_by_role("button", name="Back to Portfolio", exact=True).click()
        await expect(dialog).not_to_be_visible()

        await page.get_by_role("button", name="Desired Dividend Yield", exact=True).click()
        await expect(dialog.get_by_label("Desired dividend yield percentage")).to_have_value("6.0")
        await dialog.get_by_role("button", name="Back to Portfolio", exact=True).click()
        await expect(dialog).not_to_be_visible()

        await page.locator("#invest-budget-input").fill("4500")
        await page.get_by_role("button", name="Find stocks for this amount", exact=True).click()
        await dialog.get_by_role("button", name="Adjust Yield", exact=True).click()
        await expect(dialog.get_by_label("Desired dividend yield percentage")).to_have_value("6.0")
        print("PASS: Slider selection persists at 6% and Adjust Yield opens the same yield selector.")
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())