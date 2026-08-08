import { test, expect } from "./fixtures";

// 요일별 자동실행(autoStartByDay) 도입 전, 단일 autoStartProfileId만 있던 구버전
// config.json을 열었을 때 7일 모두 그 프로필로 채워진 형태로 자동 마이그레이션되는지 확인.
test.use({
  initialConfig: {
    profiles: [{ id: "legacy-profile", name: "기본", tasks: [] }],
    activeProfileId: "legacy-profile",
    autoStartProfileId: "legacy-profile",
  },
});

test("구버전(autoStartProfileId만 있는) 설정은 요일별 자동실행으로 마이그레이션된다", async ({
  page,
}) => {
  const weekdayCard = page.locator(".mn-card", { hasText: "요일별 자동실행 설정" });
  const selects = weekdayCard.locator("select");

  await expect(selects).toHaveCount(7);
  for (let i = 0; i < 7; i++) {
    await expect(selects.nth(i)).toHaveValue("legacy-profile");
  }
});
