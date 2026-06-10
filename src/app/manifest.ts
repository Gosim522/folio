import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Folio — 트레이딩 대시보드",
    short_name: "Folio",
    description:
      "보조 모니터에 띄워두는 실시간 자산·시세·매매 대시보드. 위젯을 자유롭게 커스터마이즈하세요.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "any",
    categories: ["finance", "productivity"],
    lang: "ko",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
