export function Footer() {
  return (
    <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-[var(--gutter)] py-8 text-xs text-muted">
      <span>Gratia AI Solutions</span>
      <span>&copy; {new Date().getFullYear()}</span>
    </footer>
  );
}
