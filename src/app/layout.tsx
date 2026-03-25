import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

const metadata: Metadata = {
  title: 'Harness — AI 문서 생성 플랫폼',
  description: '아이디어를 넣으면 보고서, PPT, 엑셀이 나옵니다. 어떤 AI를 써도 같은 품질로.',
};

export { metadata };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
