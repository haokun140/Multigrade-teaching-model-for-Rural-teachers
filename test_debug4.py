from playwright.sync_api import sync_playwright

def test_debug4():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Login
        page.goto('http://localhost:5173/login')
        page.wait_for_load_state('networkidle')

        buttons = page.locator('button').all()
        if len(buttons) > 1:
            buttons[1].click()
            page.wait_for_timeout(300)

        page.locator('input[type="tel"]').fill('13702222222')
        page.locator('input[type="password"]').fill('123456')
        page.locator('button[type="submit"]').click()
        page.wait_for_timeout(3000)
        print("1. Logged in")

        # Get class ID
        token = page.evaluate('localStorage.getItem("token")')
        classes = page.evaluate('''(token) => {
            return fetch('/api/classes', {
                headers: {'Authorization': 'Bearer ' + token}
            }).then(r => r.json())
        }''', token)
        class_id = classes['data'][0]['id']
        print(f"2. Class ID: {class_id}")

        # Go to horizontal plan
        page.goto(f'http://localhost:5173/horizontal-plans/new?classId={class_id}&date=2026-04-24&time=08%3A00-08%3A45&duration=45')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        print("3. Page loaded")

        # Click first "选择学科" button
        subject_btn = page.locator('button:has-text("选择学科")').first
        subject_btn.click(force=True)
        page.wait_for_timeout(2000)
        page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/debug_popup.png', full_page=True)

        # Find the option divs with class containing "flex items-center justify-between"
        # These are the clickable options
        option_divs = page.locator('.flex.items-center.justify-between').all()
        print(f"\n4. Option divs found: {len(option_divs)}")

        for i, div in enumerate(option_divs):
            try:
                txt = div.inner_text()
                print(f"   [{i}]: '{txt}'")
            except:
                print(f"   [{i}]: error")

        # Try clicking the first option (which should be 语文 based on debug)
        if len(option_divs) > 0:
            first_option_text = option_divs[0].inner_text()
            print(f"\n5. Clicking first option: '{first_option_text}'")
            option_divs[0].click(force=True)
            page.wait_for_timeout(1000)
            page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/debug_after_click.png', full_page=True)

            # Check what text is now shown
            body = page.locator('body').inner_text()
            if '语文' in body or 'ѽ��' in body:
                print("   SUCCESS: 语文 is in the page!")
            else:
                print(f"   Page text after click: {body[:200]}")

        print("\n6. Debug complete!")
        browser.close()

if __name__ == "__main__":
    test_debug4()