from playwright.sync_api import sync_playwright

def test_diagnostic():
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

        # 2. Get class ID
        token = page.evaluate('localStorage.getItem("token")')
        classes = page.evaluate('''(token) => {
            return fetch('/api/classes', {
                headers: {'Authorization': 'Bearer ' + token}
            }).then(r => r.json())
        }''', token)
        class_id = classes['data'][0]['id']
        print(f"2. Got class ID: {class_id}")

        # 3. Go to horizontal plan
        page.goto(f'http://localhost:5173/horizontal-plans/new?classId={class_id}&date=2026-04-24&time=08%3A00-08%3A45&duration=45')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        print("3. Page loaded")

        # Take initial screenshot
        page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/diag_initial.png', full_page=True)

        # 4. Get all buttons with "选择" text
        select_buttons = page.locator('button:has-text("选择")').all()
        print(f"\n4. Buttons with '选择': {len(select_buttons)}")
        for i, btn in enumerate(select_buttons):
            txt = btn.inner_text()
            print(f"   [{i}] {txt}")

        # 5. Click first "选择学科" and see what happens
        if len(select_buttons) > 0:
            print(f"\n5. Clicking first '选择学科' button...")
            # Find buttons that have "选择学科" specifically
            subject_btns = page.locator('button').filter(has_text="选择学科").all()
            print(f"   Found {len(subject_btns)} '选择学科' buttons")

            if len(subject_btns) > 0:
                subject_btns[0].click(force=True)
                page.wait_for_timeout(2000)
                page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/diag_subject_popup.png', full_page=True)

                # Check if popup appeared
                popup = page.locator('.fixed.inset-0').all()
                print(f"   Popups with .fixed.inset-0: {len(popup)}")

                # Get all clickable elements
                clickables = page.locator('.cursor-pointer').all()
                print(f"   Elements with cursor-pointer: {len(clickables)}")
                for i, el in enumerate(clickables[:10]):
                    txt = el.inner_text()[:50]
                    print(f"      [{i}] {txt}")

        print("\n6. Diagnostic complete!")
        browser.close()

if __name__ == "__main__":
    test_diagnostic()