import { describe, expect, it } from "vitest";
import { getWallPatternById } from "../game/wallPatterns";
import { createWallPreviewAvatarPose } from "./wallPreviewPose";

describe("createWallPreviewAvatarPose", () => {
  it("腕広げでは両手首を肩より外側へ配置する", () => {
    const pose = createWallPreviewAvatarPose(getWallPatternById("arms-wide"), 1000, 1000);
    expect(pose.leftWrist?.x).toBeLessThan(pose.leftShoulder?.x ?? 0);
    expect(pose.rightWrist?.x).toBeGreaterThan(pose.rightShoulder?.x ?? 1000);
  });

  it("ジャンプでは両足を地面から離す", () => {
    const pose = createWallPreviewAvatarPose(getWallPatternById("small-jump"), 1000, 1000);
    expect(pose.leftAnkle?.y).toBeLessThan(700);
    expect(pose.rightAnkle?.y).toBeLessThan(700);
  });

  it("大股では足首を肩より広く配置する", () => {
    const pose = createWallPreviewAvatarPose(getWallPatternById("wide-stance"), 1000, 1000);
    const ankleSpan = (pose.rightAnkle?.x ?? 0) - (pose.leftAnkle?.x ?? 0);
    const shoulderSpan = (pose.rightShoulder?.x ?? 0) - (pose.leftShoulder?.x ?? 0);
    expect(ankleSpan).toBeGreaterThan(shoulderSpan);
  });

  it("進行途中では直立姿勢から対象姿勢へ補間する", () => {
    const pattern = getWallPatternById("hands-up");
    const start = createWallPreviewAvatarPose(pattern, 1000, 1000, 0);
    const middle = createWallPreviewAvatarPose(pattern, 1000, 1000, 0.5);
    const end = createWallPreviewAvatarPose(pattern, 1000, 1000, 1);

    expect(start.leftWrist?.y).toBeGreaterThan(middle.leftWrist?.y ?? 0);
    expect(middle.leftWrist?.y).toBeGreaterThan(end.leftWrist?.y ?? 0);
  });
});
