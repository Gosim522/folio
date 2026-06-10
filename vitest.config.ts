import path from "node:path";
import { defineConfig } from "vitest/config";

// Vitest 설정. Next.js 의 @/ 별칭을 그대로 재현해 buildPortfolio 같은 순수 함수
// 들이 import 그대로 작동하게 함. DOM 안 쓰는 코드만 다루니 node 환경.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
