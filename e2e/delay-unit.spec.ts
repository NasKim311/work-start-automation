import { test, expect, makeConfig } from './fixtures';

test.use({ initialConfig: makeConfig([]) });

test('분 단위로 입력하면 초로 환산되어 저장/표시된다', async ({ page }) => {
	await page.getByPlaceholder('이름 (ex: GitLab)').fill('분단위테스트');
	await page.getByPlaceholder('주소 입력 (ex: https://naver.com)').fill('https://example.com');

	const unitButton = page.locator('button[title="단위 전환 (초/분)"]');
	await expect(unitButton).toHaveText('초');
	await unitButton.click();
	await expect(unitButton).toHaveText('분');

	await page.locator('input[type="number"]').fill('5');
	await page.locator('button[type="submit"]').click();
	await page.waitForTimeout(200);

	await expect(page.locator('.mn-row')).toContainText('대기 5분');
});
