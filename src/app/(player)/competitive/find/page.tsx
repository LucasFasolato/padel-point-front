import { Suspense } from 'react';
import RivalFinderPage from '@/app/components/competitive/rival-finder-page';

export default function CompetitiveFindRivalsPage() {
  return (
    <Suspense>
      <RivalFinderPage />
    </Suspense>
  );
}
