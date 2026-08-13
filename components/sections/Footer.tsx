export function Footer() {
  return (
    <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-white/40 sm:px-8 lg:px-12">
      <span>Gratia AI Solutions</span>
      <span>&copy; {new Date().getFullYear()}</span>
    </footer>
  );
}
