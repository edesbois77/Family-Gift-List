type Props = {
  title: string;
  summary: string;
  source: string;
  publishedAt?: string;
  url: string;
};

export default function ArticleCard({ title, summary, source, publishedAt, url }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border p-5 hover:shadow-md transition"
    >
      <div className="text-sm text-gray-500">{source}{publishedAt ? ` · ${new Date(publishedAt).toLocaleString()}` : ""}</div>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-gray-700">{summary}</p>
      <div className="mt-3 text-sm underline">Read original</div>
    </a>
  );
}
