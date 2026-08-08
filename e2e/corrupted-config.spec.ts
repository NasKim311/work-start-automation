import { test, expect } from "./fixtures";

test.use({ initialConfig: "{ 이건 유효한 JSON이 아님" });

test("손상된 config.json은 경고 알림 후 기본 설정으로 표시된다", async ({ electronApp }) => {
  // 경고 alert()는 페이지 초기 로드 중(React 마운트 시점)에 곧바로 뜨므로,
  // networkidle까지 기다리는 기본 page fixture를 쓰면 리스너를 붙이기 전에
  // 다이얼로그가 이미 (핸들러 없이) 자동으로 닫혀버릴 수 있다. 창이 생기자마자
  // 바로 리스너부터 건다.
  const window = await electronApp.firstWindow();

  const dialogs: string[] = [];
  const gotDialog = new Promise<void>((resolve) => {
    window.on("dialog", (dialog) => {
      dialogs.push(dialog.message());
      dialog.accept();
      resolve();
    });
  });

  await gotDialog;
  expect(dialogs[0]).toContain("손상");

  await window.waitForLoadState("networkidle");
  await expect(window.locator(".mn-row")).toHaveCount(0);
});
