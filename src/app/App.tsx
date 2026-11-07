import { useState } from 'react';
import { PageLayout } from './components/PageLayout/PageLayout';
import { StepIndicator } from './components/StepIndicator/StepIndicator';
import { StepNav } from './components/StepNav/StepNav';
import { ReviewPage } from './pages/ReviewPage/ReviewPage';
import { ScreenshotsPage } from './pages/ScreenshotsPage/ScreenshotsPage';
import { TeamListPage } from './pages/TeamListPage/TeamListPage';

/** The app's pages, in the order you go through them. */
const PAGES = [
  { name: 'Screenshots', Page: ScreenshotsPage },
  { name: 'Review', Page: ReviewPage },
  { name: 'Team list', Page: TeamListPage },
];

const STEP_NAMES = PAGES.map((p) => p.name);

/**
 * The whole app: three pages, one after the other. Add the two screenshots,
 * check the team read from them, then get the filled-in team list.
 */
export function App() {
  const [page, setPage] = useState(0);
  const { Page } = PAGES[page]!;

  return (
    <PageLayout
      top={
        <StepIndicator steps={STEP_NAMES} current={page} onSelect={setPage} />
      }
      bottom={
        <StepNav
          onBack={page > 0 ? () => setPage(page - 1) : undefined}
          onNext={page < PAGES.length - 1 ? () => setPage(page + 1) : undefined}
        />
      }
    >
      <Page />
    </PageLayout>
  );
}
