import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import './globals.css';

const metadata: Metadata = {
  description:
    'HARP는 AI와 대화하며 회사 표준 형식의 HR 산출물을 더 빠르고 일관되게 만드는 private-first 작업공간입니다.',
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
