import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { oneYearBefore, today } from "@/lib/dates";
import { getWellness, InvalidKey, type WellnessRow } from "@/lib/get-wellness";
import { KEY_COOKIE, TZ_COOKIE } from "@/lib/key-cookie";
import { hasTrainingData } from "@/lib/training-load";
import { EmptyState } from "./empty-state";
import { forgetKey } from "./key-actions";
import { KeyForm } from "./key-form";
import Loading from "./loading";
import { TodayLoad } from "./today-load";

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
  if (!key) {
    const { error } = await searchParams;
    return <KeyForm error={typeof error === "string" ? error : undefined} />;
  }

  await connection(); // today() reads the clock, so render at request time
  const newest = today(store.get(TZ_COOKIE)?.value);
  let rows: WellnessRow[];
  try {
    rows = await getWellness(key, { oldest: oneYearBefore(newest), newest });
  } catch (e) {
    // A server component can't delete cookies; the route clears the stale key.
    if (e instanceof InvalidKey) redirect("/invalid-key");
    // RateLimited / IntervalsUnavailable carry a digest error.tsx reads.
    throw e;
  }

  if (!hasTrainingData(rows)) return <EmptyState />;

  return (
    <>
      <TodayLoad rows={rows} />
      <form action={forgetKey}>
        <button type="submit">Forget key</button>
      </form>
    </>
  );
}
