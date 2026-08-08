import { test, expect, makeConfig } from "./fixtures";

test.describe("소요시간 계산 및 토글 UI", () => {
  test.use({
    initialConfig: makeConfig([
      { type: "browser", title: "사이트1", value: "https://example.com", delay: 10 },
      { type: "browser", title: "사이트2", value: "https://example.com", delay: 20, enabled: false },
    ]),
  });

  test("꺼진 작업은 총 예상 소요시간에서 제외되고, 토글로 다시 켤 수 있다", async ({ page }) => {
    await expect(page.getByText("총 예상 소요시간 10초")).toBeVisible();
    await expect(page.locator(".mn-row").nth(1)).toContainText("자동실행 제외됨");

    await page.locator(".mn-row").nth(1).locator(".mn-toggle-track").click();
    await page.waitForTimeout(200);

    await expect(page.getByText("총 예상 소요시간 30초")).toBeVisible();
    await expect(page.locator(".mn-row").nth(1)).not.toContainText("자동실행 제외됨");
  });
});

test.describe("실행 시 스킵 여부", () => {
  test.use({
    initialConfig: makeConfig([
      { type: "program", title: "켜진작업", value: "C:/definitely/not/real1.exe", delay: 0, enabled: true },
      { type: "program", title: "꺼진작업", value: "C:/definitely/not/real2.exe", delay: 0, enabled: false },
    ]),
  });

  test("꺼진 작업은 출근 시작하기를 눌러도 실제로 실행되지 않는다", async ({ page }) => {
    const dialogMessages: string[] = [];
    page.on("dialog", (dialog) => {
      dialogMessages.push(dialog.message());
      dialog.accept();
    });

    const runButton = page.locator("button.mn-stamp-primary.px-7");
    await runButton.click();

    // 켜진작업은 존재하지 않는 경로라 실행 실패 알림이 뜬다 — 그게 뜨는 것으로
    // "실행 시도는 됐다"를 확인하고, 꺼진작업 몫의 두 번째 알림은 뜨지 않아야 한다
    await expect.poll(() => dialogMessages.length).toBeGreaterThan(0);
    await page.waitForTimeout(500);

    expect(dialogMessages.length).toBe(1);
    expect(dialogMessages[0]).toContain("켜진작업");
  });
});
