import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Page not found</CardTitle>
        <CardDescription>The route you requested does not exist yet.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/">Return home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
