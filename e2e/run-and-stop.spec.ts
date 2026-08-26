import { test, expect, makeConfig } from './fixtures';

test.use({
	initialConfig: makeConfig([
		{
			type: 'program',
			title: '존재하지않는프로그램',
			value: 'C:/definitely/not/real.exe',
			delay: 5
		}
	])
});

test('실행 중 총 예상 소요시간을 보여주고, 중지하면 예약된 작업이 실행되지 않는다', async ({ page }) => {
	await expect(page.getByText('총 예상 소요시간 5초')).toBeVisible();

	const runButton = page.locator('button.mn-stamp-primary.px-7');
	await runButton.click();

	await expect(runButton).toContainText('실행 준비 중...');
	const stopButton = page.locator('button', { hasText: '중지' });
	await expect(stopButton).toBeVisible();

	await stopButton.click();
	await expect(runButton).toContainText('출근 시작하기');
	await expect(stopButton).not.toBeVisible();

	// delay(5초)가 지나도 취소된 예약은 실행되지 않아야 하고, 실행 에러 알림도 뜨지 않아야 한다
	let sawErrorDialog = false;
	page.on('dialog', (dialog) => {
		sawErrorDialog = true;
		dialog.accept();
	});
	await page.waitForTimeout(5500);
	expect(sawErrorDialog).toBe(false);
	await expect(runButton).toContainText('출근 시작하기');
});
