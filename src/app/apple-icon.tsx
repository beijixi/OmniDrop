import { ImageResponse } from "next/og";

import { AppIcon } from "@/lib/app-icon";

export const contentType = "image/png";
export const size = {
  height: 180,
  width: 180
};

export default function AppleIcon() {
  return new ImageResponse(<AppIcon scale={180 / 64} />, size);
}
