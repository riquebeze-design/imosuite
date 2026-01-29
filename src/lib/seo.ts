import { useEffect } from "react";

export function useSeo(opts: { title: string; description?: string }) {
  useEffect(() => {
    document.title = opts.title;
    if (opts.description) {
      const el = document.querySelector('meta[name="description"]');
      if (el) el.setAttribute("content", opts.description);
    }
  }, [opts.title, opts.description]);
}
