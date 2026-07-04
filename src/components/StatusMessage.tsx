interface StatusMessageProps {
  title: string;
  body?: string;
}

export function StatusMessage({ title, body }: StatusMessageProps) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-4 text-sm">
      <p className="font-semibold text-ink">{title}</p>
      {body ? <p className="mt-1 leading-5 text-graphite">{body}</p> : null}
    </div>
  );
}

