import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(61,90,74,0.16),transparent_55%),linear-gradient(135deg,#f7f3ec_0%,#e8dfd0_55%,#d9e0d8_100%)]"
      />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="font-display text-5xl tracking-tight text-foreground sm:text-7xl">
          HomeSpace
        </p>
        <h1 className="mt-6 max-w-2xl text-2xl font-medium leading-snug text-foreground/90 sm:text-3xl">
          See your home as a living inventory — rooms in 3D, items valued with
          clarity.
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Draw a clean floor plan, step into an interactive dollhouse, and keep
          replacement values ready for insurance or peace of mind.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sign-up">Create account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
