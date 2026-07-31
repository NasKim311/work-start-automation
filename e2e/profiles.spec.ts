import { test, expect, makeConfig } from "./fixtures";

test.use({
  initialConfig: makeConfig([
    { type: "browser", title: "Gmail", value: "https://mail.google.com", delay: 0 },
    { type: "browser", title: "GitHub", value: "https://github.com", delay: 0 },
  ]),
});

test("새 세트를 추가하면 비어있고, 다른 세트 작업에는 영향이 없다", async ({ page }) => {
  const switcher = page.locator(".mn-card").first();

  await expect(page.locator(".mn-row")).toHaveCount(2);

  await switcher.locator('button[title="새 세트 추가"]').click();
  await switcher.locator('input[placeholder*="세트 이름"]').fill("재택용");
  await switcher.locator('button[title="추가"]').click();
  await page.waitForTimeout(200);

  await expect(page.locator(".mn-row")).toHaveCount(0);
  await expect(page.getByText("아직 큐레이션된 작업이 없어요")).toBeVisible();

  await page.getByPlaceholder("이름 (ex: GitLab)").fill("Notion");
  await page.getByPlaceholder("주소 입력 (ex: https://naver.com)").fill("https://notion.so");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(200);
  await expect(page.locator(".mn-row")).toHaveCount(1);

  await switcher.locator(".mn-type-tab", { hasText: "기본" }).click();
  await page.waitForTimeout(200);
  await expect(page.locator(".mn-row")).toHaveCount(2);
});

test("자동실행 세트로 지정하면 별표가 붙는다", async ({ page }) => {
  const switcher = page.locator(".mn-card").first();

  await switcher.locator('button[title="새 세트 추가"]').click();
  await switcher.locator('input[placeholder*="세트 이름"]').fill("재택용");
  await switcher.locator('button[title="추가"]').click();
  await page.waitForTimeout(200);

  await page.getByText("자동실행 세트로 지정").click();
  await page.waitForTimeout(200);

  await expect(switcher.locator(".mn-type-tab", { hasText: "⭐" })).toHaveCount(1);
  await expect(switcher.locator(".mn-type-tab", { hasText: "⭐ 재택용" })).toBeVisible();
});
