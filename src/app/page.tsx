import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { oneYearBefore, today } from "@/lib/dates";
import {
  getWellness,
  IntervalsUnavailable,
  InvalidKey,
  RateLimited,
  type WellnessRow,
} from "@/lib/get-wellness";
import { KEY_COOKIE, TZ_COOKIE } from "@/lib/key-cookie";
import { currentValues, hasTrainingData } from "@/lib/training-load";
import { EmptyState } from "./empty-state";
import { errorCopy, keyErrorCopy } from "./error-copy";
import { ErrorView } from "./error-view";
import { Headline } from "./headline";
import { forgetKey } from "./key-actions";
import { KeyForm } from "./key-form";
import Loading from "./loading";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main>
      <h1>Fitness Tracker</h1>
      <Suspense fallback={<Loading />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const store = await cookies();
  const key = store.get(KEY_COOKIE)?.value;
  if (!key) return <KeyForm error={keyErrorCopy((await searchParams).error)} />;

  await connection(); // today() reads the clock, so render at request time
  const newest = today(store.get(TZ_COOKIE)?.value);

  // Typed errors are handled here: Next strips them before they reach error.tsx in production.
  let rows: WellnessRow[];
  try {
    rows = await getWellness(key, { oldest: oneYearBefore(newest), newest });
  } catch (e) {
    if (e instanceof InvalidKey) redirect("/invalid-key");
    if (e instanceof RateLimited || e instanceof IntervalsUnavailable) {
      return <ErrorView message={errorCopy(e)} />;
    }
    throw e;
  }

  if (!hasTrainingData(rows)) return <EmptyState />;

  return (
    <>
      <Headline current={currentValues(rows, newest)} />
      <form action={forgetKey}>
        <button type="submit">Forget key</button>
      </form>
    </>
  );
}
