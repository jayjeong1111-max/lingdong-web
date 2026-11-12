# 山水·非花 — 절차적 동양화 모음

수학 함수와 노이즈만으로 그리는 절차적 그림 네 점을 한 사이트로 묶었습니다. 빌드 과정이 없는 정적 사이트라서 폴더를 그대로 아무 정적 호스팅(GitHub Pages, Vercel, Netlify 등)에 올리면 됩니다.

| 경로 | 작품 | 내용 |
|---|---|---|
| `/` | 첫 화면 | 세 작품으로 가는 카드와 출처 |
| `/shan-shui-inf/` | 무한 산수 {山, 水}* | 옆으로 끝없이 이어지는 SVG 산수 두루마리 |
| `/nonflowers/` | 존재하지 않는 꽃 非花 | 공필화풍으로 그린, 세상에 없는 꽃 |
| `/fish-garden/` | 꽃밭 위의 물고기 魚遊花田 | 꽃 한 종으로 피운 꽃밭 위를 무작위 물고기들이 헤엄침. 원본 먹선 / 혼합 / p5.brush 수채 화풍 |
| `/horse/` | 선으로 그린 말 線馬 | 뼈대를 무작위로 잡아 선만으로 그리는 말. 체형 5종 · 자세 6종 · 무늬 5종, SVG/PNG 저장, 수채 채색 옵션(p5.brush, 시드마다 무작위 색), 달리는 모션 옵션 (이 사이트에서 새로 쓴 `horsedraw.js`) |

모든 페이지 오른쪽 위의 **⚙ 파라미터** 패널에서 생성 값을 바꿀 수 있고, 바꾼 값은 주소(`?seed=…&…`)에 저장되어 링크로 공유할 수 있습니다.

## 로컬에서 보기

```bash
python3 -m http.server 8767
```

http://localhost:8767 로 열면 됩니다. (`fish-garden`은 Web Worker를 쓰기 때문에 `file://`로 직접 열면 동작하지 않습니다.)

## 폴더 구조

```
index.html            첫 화면
shared/               이 사이트에서 만든 공용 코드 (파라미터 패널, 꽃 파라미터 연결, 빠른 픽셀 처리)
fish-garden/          꽃밭 위의 물고기 (index.html, fish-worker.js)
nonflowers/           Nonflowers 원본 + studio.js(파라미터 패널)
shan-shui-inf/        Shan Shui Infinite 원본 + studio.js(파라미터 패널)
fishdraw/             fishdraw 원본
horse/                선으로 그린 말 (horsedraw.js: 이 사이트에서 새로 쓴 생성기, index.html)
vendor/p5.brush/      p5.brush 2.2.3 (dist, src, LICENSE)
```

## 출처와 라이선스

원작 코드는 아래 커밋 그대로 가져왔고, 이 사이트에서 손댄 부분은 다음과 같습니다.

- **Shan Shui Infinite** — Lingdong Huang · MIT · [`9f754d2`](https://github.com/LingDong-/shan-shui-inf/tree/9f754d2b2e73495db7883d4d4055a7b0903b0454)
  수정: 산 배치 상수를 URL 파라미터로 바꿈, UTF-8 charset·viewport 메타 추가, 파라미터 패널(`studio.js`)과 먹 번짐 SVG 필터 추가, `CNAME` 제거.
- **Nonflowers** — Lingdong Huang · MIT · [`03b653d`](https://github.com/LingDong-/nonflowers/tree/03b653d220f16c6bed7ea9c7edc852f7e91846cb)
  수정: `main.js`는 그대로 두고 `index.html`에 패널 스크립트를 추가, `CNAME` 제거.
- **fishdraw** — Lingdong Huang · MIT · [`a514372`](https://github.com/LingDong-/fishdraw/tree/a514372de1d05b4aa32a9e35aadec9a5299689a2)
  수정: 없음 (`CNAME` 제거만).
- **p5.brush 2.2.3** — Alejandro Campos Uribe · MIT · [`f2ffc89`](https://github.com/acamposuribe/p5.brush/tree/f2ffc89d199df7b88ce6672d8d4ee7e0bb58f26e)
  단독 실행 빌드(`dist/brush.js`)를 사용합니다. 수채 방식은 [Tyler Hobbs](https://tylerxhobbs.com/essays/2017/a-generative-approach-to-simulating-watercolor-paints)의 방법을, 색 혼합은 [Spectral.js](https://github.com/rvanwijnen/spectral.js)(Ronald van Wijnen · MIT)를 바탕으로 합니다.
- **p5.js** — 단독 실행 빌드를 써서 p5.js 본체(LGPL-2.1)는 포함하지 않았습니다.

각 라이선스 전문은 해당 폴더의 `LICENSE` / `LICENSE.md` 파일에 있습니다.
