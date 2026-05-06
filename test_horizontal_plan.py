from playwright.sync_api import sync_playwright

def test_enter_step2():
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
        page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/step1_initial.png', full_page=True)

        def configure_first_grade():
            """Configure the first grade (语文, 人教版, 上册)"""
            # Subject
            subject_btn = page.locator('button:has-text("选择学科")').first
            subject_btn.scroll_into_view_if_needed()
            subject_btn.click(force=True)
            page.wait_for_timeout(2000)

            # Click 语文
            page.locator('text=语文').first.click(force=True)
            page.wait_for_timeout(1000)
            print("   Subject: 语文")

            # Version
            page.wait_for_selector('button:has-text("选择版本")', state='attached')
            version_btn = page.locator('button:has-text("选择版本")').first
            version_btn.scroll_into_view_if_needed()
            version_btn.click(force=True)
            page.wait_for_timeout(2000)

            page.locator('text=人教版').first.click(force=True)
            page.wait_for_timeout(1000)
            print("   Version: 人教版")

            # Volume
            page.wait_for_selector('button:has-text("选择册次")', state='attached')
            volume_btn = page.locator('button:has-text("选择册次")').first
            volume_btn.scroll_into_view_if_needed()
            volume_btn.click(force=True)
            page.wait_for_timeout(2000)

            page.locator('text=上册').first.click(force=True)
            page.wait_for_timeout(1000)
            print("   Volume: 上册")

            # Unit
            page.wait_for_selector('button:has-text("选择单元")', state='attached')
            unit_btn = page.locator('button:has-text("选择单元")').first
            unit_btn.scroll_into_view_if_needed()
            unit_btn.click(force=True)
            page.wait_for_timeout(2000)

            opts = page.locator('.overflow-y-auto > div').all()
            if opts:
                opts[0].click(force=True)
                page.wait_for_timeout(300)

            page.locator('button:has-text("确定")').first.click(force=True)
            page.wait_for_timeout(500)
            print("   Unit: selected")

        def configure_second_grade():
            """Configure the second grade (数学, 北师大版, 下册)"""
            page.wait_for_timeout(1000)
            page.evaluate('window.scrollBy(0, 300)')
            page.wait_for_timeout(500)

            subject_btns = page.locator('button:has-text("选择学科")').all()
            print(f"   Total 选择学科 buttons: {len(subject_btns)}")

            if len(subject_btns) >= 1:
                btn = subject_btns[0]
                btn.scroll_into_view_if_needed()
                btn.click(force=True)
                page.wait_for_timeout(3000)
                page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/g2_subject.png', full_page=True)

                popup = page.locator('.fixed.inset-0.z-\\[60\\]')
                popup_count = popup.count()
                print(f"   Popup count: {popup_count}")

                if popup_count > 0:
                    page.locator('text=数学').first.click(force=True)
                    page.wait_for_timeout(1000)
                    print("   Subject: 数学")
                else:
                    print("   ERROR: Popup did not appear!")
                    return False

            page.wait_for_timeout(1000)

            # Version
            version_btn = page.locator('button:has-text("选择版本")').first
            version_btn.scroll_into_view_if_needed()
            version_btn.click(force=True)
            page.wait_for_timeout(2000)

            page.locator('text=北师大版').first.click(force=True)
            page.wait_for_timeout(1000)
            print("   Version: 北师大版")

            # Volume
            volume_btn = page.locator('button:has-text("选择册次")').first
            volume_btn.scroll_into_view_if_needed()
            volume_btn.click(force=True)
            page.wait_for_timeout(2000)

            page.locator('text=下册').first.click(force=True)
            page.wait_for_timeout(1000)
            print("   Volume: 下册")

            # Unit
            unit_btn = page.locator('button:has-text("选择单元")').first
            unit_btn.scroll_into_view_if_needed()
            unit_btn.click(force=True)
            page.wait_for_timeout(2000)

            opts = page.locator('.overflow-y-auto > div').all()
            if opts:
                opts[0].click(force=True)
                page.wait_for_timeout(300)

            page.locator('button:has-text("确定")').first.click(force=True)
            page.wait_for_timeout(500)
            print("   Unit: selected")

            return True

        # 4. Configure grade 1
        print("\n4. Configuring grade 1 (一年级)...")
        configure_first_grade()
        page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/after_g0.png', full_page=True)

        # 5. Configure grade 2
        print("\n5. Configuring grade 2 (二年级)...")
        success = configure_second_grade()
        page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/after_g1.png', full_page=True)

        if not success:
            print("   Grade 2 configuration failed!")

        # 6. Click 下一步
        print("\n6. Clicking 下一步...")
        page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/before_next.png', full_page=True)

        next_btn = page.get_by_text("下一步").first
        if next_btn.count() > 0:
            next_btn.click(force=True)
            page.wait_for_timeout(3000)
            page.screenshot(path='e:/TRAE-PROJECT/XiangCunTeacher IDE/test_screenshots/step2_result.png', full_page=True)
            print("   Clicked 下一步")
        else:
            print("   下一步 button not found!")

        # 7. Check URL
        print(f"\n7. URL: {page.url}")

        # 8. Check step 2 elements
        print("\n8. Step 2 verification:")
        body_text = page.locator('body').inner_text()

        elements = [
            '横向备课配置',
            '教学步骤',
            '添加步骤',
            '动+静',
            '跨年级互动',
        ]
        for text in elements:
            status = "OK" if text in body_text else "MISSING"
            print(f"   {text}: {status}")

        print("\n9. Test completed!")
        browser.close()

if __name__ == "__main__":
    test_enter_step2()