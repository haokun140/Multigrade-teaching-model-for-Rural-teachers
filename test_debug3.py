from playwright.sync_api import sync_playwright

def test_debug3():
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

        token = page.evaluate('localStorage.getItem("token")')

        # Get ALL curriculum configs
        configs = page.evaluate('''(token) => {
            return fetch('/api/schools/curriculum-configs', {
                headers: {'Authorization': 'Bearer ' + token}
            }).then(r => r.json())
        }''', token)
        print(f"\n2. All curriculum configs: {len(configs.get('data', []))} configs")

        # Group by grade and subject
        by_grade = {}
        for c in configs.get('data', []):
            gid = c.get('gradeId', 0)
            if gid not in by_grade:
                by_grade[gid] = []
            by_grade[gid].append(c.get('subjectId', 'N/A'))

        for gid in sorted(by_grade.keys())[:6]:
            subjects = by_grade[gid]
            print(f"   Grade {gid}: {len(subjects)} subjects - {set(subjects)}")

        # Check specifically for grade 1 configs
        grade1_configs = [c for c in configs.get('data', []) if c.get('gradeId') == 1]
        print(f"\n3. Grade 1 configs ({len(grade1_configs)}):")
        for c in grade1_configs[:10]:
            print(f"   subjectId={c.get('subjectId')}, version={c.get('version')}")

        print("\n4. Debug complete!")
        browser.close()

if __name__ == "__main__":
    test_debug3()