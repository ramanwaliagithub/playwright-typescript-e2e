import * as AxeCorePlaywright from '@axe-core/playwright';
import { test, expect } from '../../fixtures/pages.fixture.js';

// @axe-core/playwright's package.json doesn't split "types" per import/require condition in its
// exports map, which this project's pinned TS version can't reconcile under NodeNext module
// resolution — a default or named-destructured import both resolve to the whole module
// namespace instead of the AxeBuilder class ("This expression is not constructable"). Importing
// as a namespace and reading the property off it resolves to the real class correctly.
const { AxeBuilder } = AxeCorePlaywright;

/**
 * RBP is a third-party demo app we don't control — scanning the real hosted instance found
 * genuine, pre-existing serious/critical issues no change here can fix. "Baseline" means: fail
 * only on a NEW serious/critical violation, not the ones already known below. Moderate/minor
 * violations (e.g. `landmark-one-main`, `region`, `heading-order`) exist too but are out of
 * scope for this initial baseline, which only gates serious/critical impact.
 *
 * Update this list deliberately if a fresh scan shows it's stale (RBP's UI changed in a way that
 * legitimately adds a new accepted issue) — never just to make a failing test pass.
 */
function unexpectedViolations(
  violations: Awaited<ReturnType<InstanceType<typeof AxeBuilder>['analyze']>>['violations'],
  knownIssueIds: string[],
) {
  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .filter((violation) => !knownIssueIds.includes(violation.id));
}

test.describe('accessibility baseline', () => {
  test('booking homepage has no new critical/serious violations', async ({
    page,
    bookingHomePage,
  }) => {
    await bookingHomePage.open();
    const results = await new AxeBuilder({ page }).analyze();
    // color-contrast: dark navbar/footer text; label: an unlabeled form control; link-name: a
    // link with no discernible accessible text — all pre-existing on RBP's own markup.
    const unexpected = unexpectedViolations(results.violations, [
      'color-contrast',
      'label',
      'link-name',
    ]);
    expect(unexpected, JSON.stringify(unexpected, null, 2)).toEqual([]);
  });

  test('admin login page has no new critical/serious violations', async ({
    page,
    adminLoginPage,
  }) => {
    await adminLoginPage.open();
    const results = await new AxeBuilder({ page }).analyze();
    // color-contrast: same dark navbar shared across the app.
    const unexpected = unexpectedViolations(results.violations, ['color-contrast']);
    expect(unexpected, JSON.stringify(unexpected, null, 2)).toEqual([]);
  });
});
