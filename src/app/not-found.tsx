import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="surface flex max-w-md flex-col items-center gap-4 p-8 text-center shadow-[var(--shadow-2)]">
        <h2 className="text-4xl font-bold text-[var(--color-accent)]">404</h2>
        <h3 className="text-xl font-bold text-[var(--color-text)]">페이지를 찾을 수 없습니다</h3>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          요청하신 페이지가 삭제되었거나 주소가 잘못되었습니다.
        </p>
        <Link className="btn-primary mt-4" href="/workspace">
          작업공간으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
