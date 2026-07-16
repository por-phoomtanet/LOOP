export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-bold text-[#0a0a0a]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-black/55">{subtitle}</p>}
      </div>
      {extra}
    </div>
  );
}
