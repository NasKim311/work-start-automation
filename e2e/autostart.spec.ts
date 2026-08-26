import { test, expect, _electron as electron } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { makeConfig } from './fixtures';

const repoRoot = path.resolve(__dirname, '..');

// 자동 실행 토글: get-auto-start/set-auto-start가 서로 다른 args로 로그인
// 항목을 다뤄서, 실제로는 등록됐는데도 앱을 재시작하면 토글이 꺼진 것처럼
// 보이던 회귀 버그. Windows의 실제 로그인 항목(레지스트리)에 남기 때문에
// 성공/실패와 무관하게 항상 정리한다.
test('자동 실행 설정이 앱을 재시작해도 유지된다', async () => {
	const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deskready-e2e-autostart-'));
	fs.writeFileSync(path.join(userDataDir, 'config.json'), JSON.stringify(makeConfig([]), null, 2));

	let app1: Awaited<ReturnType<typeof electron.launch>> | undefined;
	let app2: Awaited<ReturnType<typeof electron.launch>> | undefined;

	try {
		app1 = await electron.launch({
			args: ['.', `--user-data-dir=${userDataDir}`],
			cwd: repoRoot
		});
		const page1 = await app1.firstWindow();
		await page1.waitForLoadState('networkidle');

		await expect(page1.locator('.mn-toggle-dot')).toHaveCSS('left', '3px');
		await page1.locator('.mn-toggle-track').click();
		await page1.waitForTimeout(300);
		await expect(page1.locator('.mn-toggle-dot')).toHaveCSS('left', '22px');

		await app1.close();
		app1 = undefined;

		app2 = await electron.launch({
			args: ['.', `--user-data-dir=${userDataDir}`],
			cwd: repoRoot
		});
		const page2 = await app2.firstWindow();
		await page2.waitForLoadState('networkidle');

		// 회귀 포인트: 재시작 후에도 토글이 켜진 상태로 보여야 한다
		await expect(page2.locator('.mn-toggle-dot')).toHaveCSS('left', '22px');
	} finally {
		for (const app of [app1, app2]) {
			if (!app) continue;
			await app
				.evaluate(({ app: electronApp }) => {
					electronApp.setLoginItemSettings({ openAtLogin: false });
				})
				.catch(() => {});
			await app
				.evaluate(({ BrowserWindow }) => {
					BrowserWindow.getAllWindows().forEach((w) => w.destroy());
				})
				.catch(() => {});
			await app.close().catch(() => {});
		}
		fs.rmSync(userDataDir, { recursive: true, force: true });
	}
});
