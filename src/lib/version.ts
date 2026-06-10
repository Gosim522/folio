// 앱 버전 (package.json 의 단일 진실 원천에서 빌드 시점에 읽어옴).
// JSON import 라 트리쉐이킹은 안 되지만 package.json 자체가 작아 영향 없음.
import { version } from "../../package.json";

export const APP_VERSION = version;
