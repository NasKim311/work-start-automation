import { test, expect, makeConfig } from './fixtures';

test.use({
	initialConfig: makeConfig([
		{ type: 'browser', title: 'Gmail', value: 'https://mail.google.com', delay: 0 },
		{ type: 'browser', title: 'GitHub', value: 'https://github.com', delay: 0 },
		{ type: 'program', title: '메모장', value: 'notepad.exe', delay: 0 }
	])
});

test('드래그로 항목을 임의 위치로 재배치할 수 있다', async ({ page }) => {
	const titles = async () => {
		const rows = page.locator('.mn-row');
		const count = await rows.count();
		const result: string[] = [];
		for (let i = 0; i < count; i++) {
			result.push((await rows.nth(i).locator('p.font-bold').innerText()).trim());
		}
		return result;
	};

	await expect.poll(titles).toEqual(['Gmail', 'GitHub', '메모장']);

	const rows = page.locator('.mn-row');
	await rows.nth(2).dragTo(rows.nth(0));
	await page.waitForTimeout(200);

	await expect.poll(titles).toEqual(['메모장', 'Gmail', 'GitHub']);
});

test('위/아래 버튼은 인접한 위치로만 이동한다', async ({ page }) => {
	const rows = page.locator('.mn-row');
	await rows.nth(0).locator('button[title="아래로 내리기"]').click();
	await page.waitForTimeout(200);

	const first = await rows.nth(0).locator('p.font-bold').innerText();
	expect(first.trim()).toBe('GitHub');
});
