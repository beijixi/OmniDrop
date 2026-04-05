import { ImageResponse } from "next/og";

import { AppIcon } from "@/lib/app-icon";

export const contentType = "image/png";
export const size = {
  height: 64,
  width: 64
};

export default function Icon() {
  return new ImageResponse(<AppIcon />, size);
}
