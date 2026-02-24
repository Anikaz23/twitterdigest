import DigestDetailLoader from "@/components/digest-detail-loader";

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DigestDetailLoader digestId={id} />;
}
