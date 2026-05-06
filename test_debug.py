from playwright.sync_api import sync_playwright

def test_debug():
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

        # Get auth token
        token = page.evaluate('localStorage.getItem("token")')
        print(f"Token: {token[:50]}...")

        # Get subjects from API
        subjects = page.evaluate('''(token) => {
            return fetch('/api/schools/subjects', {
                headers: {'Authorization': 'Bearer ' + token}
            }).then(r => r.json())
        }''', token)
        print(f"\n2. Subjects from API:")
        for s in subjects.get('data', []):
            print(f"   {s['id']}: {s['name']}")

        # Get classes
        classes = page.evaluate('''(token) => {
            return fetch('/api/classes', {
                headers: {'Authorization': 'Bearer ' + token}
            }).then(r => r.json())
        }''', token)
        class_id = classes['data'][0]['id']
        print(f"\n3. Class ID: {class_id}")

        # Get curriculum configs for grade 1
        configs = page.evaluate(f'''(token) => {{
            return fetch('/api/schools/curriculum-configs?gradeId=1', {{
                headers: {{'Authorization': 'Bearer ' + token}}
            }}).then(r => r.json())
        }}''', token)
        print(f"\n4. Curriculum configs for grade 1:")
        for c in configs.get('data', [])[:10]:
            print(f"   {c['subjectId']}: {c['subjectName']} - {c['version']} - {c.get('volumes', [])}")

        # Get class details
        class_detail = page.evaluate(f'''(token) => {{
            return fetch('/api/classes/{class_id}', {{
                headers: {{'Authorization': 'Bearer ' + token}}
            }}).then(r => r.json())
        }}''', token)
        print(f"\n5. Class detail:")
        print(f"   {class_detail}")

        print("\n6. Debug complete!")
        browser.close()

if __name__ == "__main__":
    test_debug()