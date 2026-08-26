import { test, expect, makeConfig } from './fixtures';

test.use({
	initialConfig: makeConfig([
		{ type: 'browser', title: 'Gmail', value: 'https://mail.google.com', delay: 0 },
		{ type: 'browser', title: 'GitHub', value: 'https://github.com', delay: 0 }
	])
});

test('새 세트를 추가하면 비어있고, 다른 세트 작업에는 영향이 없다', async ({ page }) => {
	const switcher = page.locator('.mn-card').first();

	await expect(page.locator('.mn-row')).toHaveCount(2);

	await switcher.locator('button[title="새 세트 추가"]').click();
	await switcher.locator('input[placeholder*="세트 이름"]').fill('재택용');
	await switcher.locator('button[title="추가"]').click();
	await page.waitForTimeout(200);

	await expect(page.locator('.mn-row')).toHaveCount(0);
	await expect(page.getByText('아직 큐레이션된 작업이 없어요')).toBeVisible();

	await page.getByPlaceholder('이름 (ex: GitLab)').fill('Notion');
	await page.getByPlaceholder('주소 입력 (ex: https://naver.com)').fill('https://notion.so');
	await page.locator('button[type="submit"]').click();
	await page.waitForTimeout(200);
	await expect(page.locator('.mn-row')).toHaveCount(1);

	await switcher.locator('.mn-type-tab', { hasText: '기본' }).click();
	await page.waitForTimeout(200);
	await expect(page.locator('.mn-row')).toHaveCount(2);
});

test('요일별로 다른 세트를 자동실행으로 지정할 수 있다', async ({ page }) => {
	const switcher = page.locator('.mn-card').first();
	const weekdayCard = page.locator('.mn-card', { hasText: '요일별 자동실행 설정' });

	await switcher.locator('button[title="새 세트 추가"]').click();
	await switcher.locator('input[placeholder*="세트 이름"]').fill('재택용');
	await switcher.locator('button[title="추가"]').click();
	await page.waitForTimeout(200);

	// 화면 표시 순서(월~일) 상 첫 번째 select가 월요일, 두 번째가 화요일
	const mondaySelect = weekdayCard.locator('select').nth(0);
	const tuesdaySelect = weekdayCard.locator('select').nth(1);

	// makeConfig가 기본 세트("e2e-default-profile")로 7일을 전부 채워서 시작한다
	await expect(mondaySelect).toHaveValue('e2e-default-profile');
	await expect(tuesdaySelect).toHaveValue('e2e-default-profile');

	await mondaySelect.selectOption({ label: '재택용' });

	await expect(mondaySelect).not.toHaveValue('e2e-default-profile');
	await expect(tuesdaySelect).toHaveValue('e2e-default-profile');
});
