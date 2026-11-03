import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { oneYearBefore, today } from "@/lib/dates";
import { getWellness } from "@/lib/get-wellness";
import { KEY_COOKIE } from "@/lib/key-cookie";
import { forgetKey } from "./key-actions";
import { KeyForm } from "./key-form";
import { TodayLoad } from "./today-load";

export default function Home() {
  return (
    <main>
      <h1>Fitness Tracker</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}

async function Content() {
  const key = (await cookies()).get(KEY_COOKIE)?.value;
  if (!key) return <KeyForm />;

  await connection(); // today() reads the clock, so render at request time
  const newest = today();
  const rows = await getWellness(key, { oldest: oneYearBefore(newest), newest });

  return (
    <>
      <TodayLoad rows={rows} />
      <form action={forgetKey}>
        <button type="submit">Forget key</button>
      </form>
    </>
  );
}
