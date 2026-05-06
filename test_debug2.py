from playwright.sync_api import sync_playwright

def test_debug2():
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
        page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/debug_subject_popup.png', full_page=True)

        # Get ALL text in the popup
        popup = page.locator('.fixed.inset-0.z-\\[60\\]')
        if popup.count() > 0:
            popup_text = popup.inner_text()
            print(f"\n4. Popup text: {popup_text[:500]}")

            # Get all divs in popup
            divs = popup.locator('div').all()
            print(f"   Total divs in popup: {len(divs)}")

            # Get text from each div that might be an option
            for i, div in enumerate(divs[:20]):
                try:
                    txt = div.inner_text()[:50]
                    cls = div.get_attribute('class') or ''
                    if txt.strip():
                        print(f"   div[{i}]: class={cls[:30]}, text={txt}")
                except:
                    pass

        # Try clicking "语文" directly using text
        try:
            # Find all elements containing "语文"
            all语文 = page.get_by_text("语文").all()
            print(f"\n5. Elements containing '语文': {len(all语文)}")
            for i, el in enumerate(all语文):
                try:
                    cls = el.get_attribute('class') or ''
                    print(f"   [{i}]: class={cls[:40]}, text={el.inner_text()[:30]}")
                except:
                    pass
        except Exception as e:
            print(f"5. Error finding 语文: {e}")

        print("\n6. Debug complete!")
        browser.close()

if __name__ == "__main__":
    test_debug2()