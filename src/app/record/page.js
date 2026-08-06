import RecordDetailsClient from "@/components/RecordDetailsClient";

export default function RecordPage({ searchParams }) {
  const recordId = searchParams?.id;

  if (!recordId) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-400">No record selected. Please use the verify form or provide an ID.</p>
      </div>
    );
  }

  return <RecordDetailsClient recordId={recordId} />;
}
