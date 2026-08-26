import { test, expect, makeConfig } from './fixtures';

test.use({
	initialConfig: makeConfig([{ type: 'browser', title: '테스트사이트', value: 'https://example.com', delay: 0 }])
});

test('삭제 버튼은 확인 다이얼로그를 거치고, 취소하면 삭제되지 않는다', async ({ page }) => {
	const dialogs: string[] = [];
	page.on('dialog', (dialog) => {
		dialogs.push(dialog.type());
		dialog.dismiss();
	});

	await expect(page.locator('.mn-row')).toHaveCount(1);

	await page.locator('button[title="삭제하기"]').click();
	await page.waitForTimeout(200);

	expect(dialogs).toEqual(['confirm']);
	await expect(page.locator('.mn-row')).toHaveCount(1);
});

test('확인하면 실제로 삭제된다', async ({ page }) => {
	page.on('dialog', (dialog) => dialog.accept());

	await expect(page.locator('.mn-row')).toHaveCount(1);
	await page.locator('button[title="삭제하기"]').click();

	await expect(page.locator('.mn-row')).toHaveCount(0);
});
