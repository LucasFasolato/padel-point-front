import { Suspense } from 'react';
import NewChallengeClient from './new-challenge-client';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NewChallengeClient />
    </Suspense>
  );
}
