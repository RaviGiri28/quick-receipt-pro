import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4">
      <div className="card-soft w-full max-w-md p-8 text-center animate-fade-in-up sm:p-10">
        <div className="relative mx-auto mb-6 w-fit">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
          <LogoMark className="relative h-16 w-16 animate-float" />
        </div>
        <p className="text-6xl font-extrabold tracking-tight text-primary">404</p>
        <h1 className="mt-2 text-xl font-bold text-navy">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{location.pathname}</code>. It may have been moved or deleted.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft /> Go Back
          </Button>
          <Button asChild>
            <Link to="/"><Home /> Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
