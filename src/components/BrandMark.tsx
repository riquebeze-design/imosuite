export function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-2xl bg-primary/10 ring-1 ring-primary/15 grid place-items-center">
        <div className="h-4 w-4 rounded-md bg-primary" />
      </div>
      <div className="leading-none">
        <div className="text-[15px] font-semibold tracking-tight">AtlasCasa</div>
        <div className="text-[11px] text-muted-foreground">Imobiliária • Portugal</div>
      </div>
    </div>
  );
}
