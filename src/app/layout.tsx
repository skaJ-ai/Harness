import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import './globals.css';

const metadata: Metadata = {
  description:
    'HARP는 AI와 대화하며 회사 표준 형식의 HR 산출물을 더 빠르고 일관되게 만드는 private-first 작업공간입니다.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌊</text></svg>',
  },
  title: 'HARP — HR AI Report Platform',
};

export { metadata };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
