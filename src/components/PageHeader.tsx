export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6 px-1 pt-1">
      <h1 className="text-[32px] font-bold leading-tight tracking-tight text-slate-900">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-[14px] text-slate-400">{subtitle}</p>}
    </header>
  );
}
