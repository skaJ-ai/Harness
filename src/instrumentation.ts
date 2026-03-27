import { runApplicationBootstrap } from '@/lib/bootstrap';

async function register() {
  await runApplicationBootstrap();
}

export { register };
