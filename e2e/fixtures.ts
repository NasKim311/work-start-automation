import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { test as base, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";

const repoRoot = path.resolve(__dirname, "..");

export function makeConfig(tasks: unknown[]) {
  const id = "e2e-default-profile";
  return {
    profiles: [{ id, name: "기본", tasks }],
    activeProfileId: id,
    autoStartProfileId: id,
  };
}

type Fixtures = {
  userDataDir: string;
  initialConfig: object | undefined;
  electronApp: ElectronApplication;
  page: Page;
};

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  initialConfig: [undefined, { option: true }],

  // eslint-disable-next-line no-empty-pattern
  userDataDir: async ({}, use) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deskready-e2e-"));
    await use(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  },

  electronApp: async ({ userDataDir, initialConfig }, use) => {
    if (initialConfig) {
      fs.writeFileSync(
        path.join(userDataDir, "config.json"),
        JSON.stringify(initialConfig, null, 2)
      );
    }

    const app = await electron.launch({
      args: [".", `--user-data-dir=${userDataDir}`],
      cwd: repoRoot,
    });
    await use(app);

    // 테스트가 앱을 dirty 상태로 남겨두면 실제 "저장 안 한 변경사항" 확인
    // 다이얼로그가 떠서 아무도 응답하지 않는 채로 멈춘다 — 테스트 데이터는
    // 어차피 버려도 되는 임시 프로필이므로, 확인 절차를 건너뛰고 창을
    // 강제로 destroy해서 정리한다.
    await app
      .evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows().forEach((w) => w.destroy());
      })
      .catch(() => {});
    await app.close().catch(() => {});
  },

  page: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState("networkidle");
    await use(window);
  },
});

export { expect } from "@playwright/test";
