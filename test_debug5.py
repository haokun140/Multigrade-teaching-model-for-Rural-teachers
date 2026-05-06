from playwright.sync_api import sync_playwright

def test_debug5():
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

        # Count "选择学科" buttons before
        btns_before = page.locator('button:has-text("选择学科")').count()
        print(f"4. Buttons before any click: {btns_before}")

        # Get ALL button texts on page
        all_buttons = page.locator('button').all()
        print(f"5. All buttons ({len(all_buttons)}):")
        for i, btn in enumerate(all_buttons):
            try:
                txt = btn.inner_text()
                if txt:
                    print(f"   [{i}] '{txt}'")
            except:
                pass

        # Click first "选择学科" button
        print("\n6. Clicking first 选择学科...")
        subject_btn = page.locator('button:has-text("选择学科")').first
        subject_btn.click(force=True)
        page.wait_for_timeout(2000)

        # Check popup
        popup_text = page.locator('.overflow-y-auto').inner_text()
        print(f"7. Popup text: '{popup_text}'")

        # Click first option (语文)
        options = popup_text.split('\n')
        if options:
            first_opt = options[0].strip()
            print(f"8. Clicking first option: '{first_opt}'")
            page.locator(f'text={first_opt}').first.click(force=True)
            page.wait_for_timeout(2000)

        # Count buttons after selection
        btns_after = page.locator('button:has-text("选择学科")').count()
        print(f"9. Buttons after selection: {btns_after}")

        # Get ALL button texts
        all_buttons_after = page.locator('button').all()
        print(f"10. All buttons after ({len(all_buttons_after)}):")
        for i, btn in enumerate(all_buttons_after):
            try:
                txt = btn.inner_text()
                if txt:
                    print(f"   [{i}] '{txt}'")
            except:
                pass

        # Take screenshot
        page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/debug_after_selection.png', full_page=True)

        # Now try to find the second grade's subject button
        # It should show "选择学科" if not configured, or the subject name if configured
        print("\n11. Looking for grade 2 subject button...")
        # Try getting button at index 1
        try:
            btn1 = page.locator('button:has-text("选择学科")').nth(1)
            if btn1.count() > 0:
                txt = btn1.inner_text()
                print(f"   Button at index 1: '{txt}'")
            else:
                print("   Button at index 1: NOT FOUND")
        except Exception as e:
            print(f"   Error: {e}")

        # Try getting all buttons with "选择学科" text
        all_subject_btns = page.locator('button:has-text("选择学科")').all()
        print(f"12. Total '选择学科' buttons: {len(all_subject_btns)}")

        # Try to find buttons by partial text match for grade 2
        # Maybe grade 2 still has "选择学科" but it's not visible or has different text
        all_btns_text = []
        for btn in page.locator('button').all():
            try:
                txt = btn.inner_text()
                all_btns_text.append(txt)
            except:
                pass
        print(f"13. All button texts: {all_btns_text}")

        print("\n14. Debug complete!")
        browser.close()

if __name__ == "__main__":
    test_debug5()