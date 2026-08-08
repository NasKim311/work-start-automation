import * as fs from "fs";
import * as path from "path";
import { test, expect, makeConfig } from "./fixtures";

// 경고/복구 alert()는 페이지 초기 로드 중(React 마운트 시점)에 곧바로 뜨므로,
// networkidle까지 기다리는 기본 page fixture를 쓰면 리스너를 붙이기 전에
// 다이얼로그가 이미 (핸들러 없이) 자동으로 닫혀버릴 수 있다. 창이 생기자마자
// 바로 리스너부터 거는 헬퍼.
async function catchFirstDialog(electronApp: import("@playwright/test").ElectronApplication) {
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
  return { window, dialogs };
}

test.describe("백업본(.bak)이 없는 경우", () => {
  test.use({ initialConfig: "{ 이건 유효한 JSON이 아님" });

  test("손상된 config.json은 경고 알림 후 기본 설정으로 표시된다", async ({ electronApp }) => {
    const { window, dialogs } = await catchFirstDialog(electronApp);
    expect(dialogs[0]).toContain("손상");

    await window.waitForLoadState("networkidle");
    await expect(window.locator(".mn-row")).toHaveCount(0);
  });
});

test.describe("백업본(.bak)이 유효한 경우", () => {
  test.use({
    initialConfig: "{ 이건 유효한 JSON이 아님",
    initialConfigBak: makeConfig([
      { type: "browser", title: "백업된사이트", value: "https://example.com", delay: 0 },
    ]),
  });

  test("손상된 config.json은 .bak으로 자동 복구되고, 원본도 자가 치유된다", async ({
    electronApp,
    userDataDir,
  }) => {
    const { window, dialogs } = await catchFirstDialog(electronApp);
    expect(dialogs[0]).toContain("자동 복구");

    await window.waitForLoadState("networkidle");
    await expect(window.locator(".mn-row")).toHaveCount(1);
    await expect(window.locator(".mn-row")).toContainText("백업된사이트");

    // 복구된 내용으로 config.json 자체가 재저장되어, 다음 실행부터는 정상 로드돼야 한다
    const healed = JSON.parse(fs.readFileSync(path.join(userDataDir, "config.json"), "utf8"));
    expect(healed.profiles[0].tasks[0].title).toBe("백업된사이트");
  });
});
