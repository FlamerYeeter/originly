import RecordDetailsClient from "@/components/RecordDetailsClient";

export default function RecordPage({ params }) {
  const { id } = params;
  return <RecordDetailsClient recordId={id} />;
}
