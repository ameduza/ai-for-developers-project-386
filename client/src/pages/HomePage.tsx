import { Link } from "react-router-dom";
import { ArrowRight, CalendarRange, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Contract-first booking frontend
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Booking Service
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              A Vite SPA scaffold for the Guest and Owner flows, wired for TanStack Query,
              shadcn/ui, and the TypeSpec API contract.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/guest">
                Open guest area <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/owner">
                Open owner area <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Foundation in place</CardTitle>
            <CardDescription>Ready for the later booking screens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <CalendarRange className="h-4 w-4 text-primary" />
              Guest and Owner route shells
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-primary" />
              No-auth flow preserved
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-primary" />
              shadcn-style primitives and layout
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
