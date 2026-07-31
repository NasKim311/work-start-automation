import { test, expect, makeConfig } from "./fixtures";

test.use({ initialConfig: makeConfig([]) });

async function addUnsavedTask(page: import("@playwright/test").Page) {
  await page.getByPlaceholder("이름 (ex: GitLab)").fill("임시작업");
  await page
    .getByPlaceholder("주소 입력 (ex: https://naver.com)")
    .fill("https://example.com");
  await page.locator('button[type="submit"]').click();
  // notify-dirty-state가 main 프로세스에 도달할 시간을 확보
  await page.waitForTimeout(300);
}

test("저장 안 한 변경사항이 있으면 닫을 때 확인 다이얼로그가 뜨고, 취소하면 창이 유지된다", async ({
  electronApp,
  page,
}) => {
  await addUnsavedTask(page);

  const calls = await electronApp.evaluate(({ dialog, BrowserWindow }) => {
    let callCount = 0;
    dialog.showMessageBoxSync = (() => {
      callCount++;
      return 2; // "취소"
    }) as typeof dialog.showMessageBoxSync;

    BrowserWindow.getAllWindows()[0].close();

    return new Promise<number>((resolve) => {
      setTimeout(() => resolve(callCount), 300);
    });
  });

  expect(calls).toBe(1);
  expect(electronApp.windows().length).toBe(1);
});

test("\"저장하지 않고 닫기\"를 선택하면 앱이 종료된다", async ({ electronApp, page }) => {
  await addUnsavedTask(page);

  await electronApp.evaluate(({ dialog, BrowserWindow }) => {
    dialog.showMessageBoxSync = (() => 1) as typeof dialog.showMessageBoxSync; // "저장하지 않고 닫기"
    BrowserWindow.getAllWindows()[0].close();
  });

  await electronApp.waitForEvent("close");
});
