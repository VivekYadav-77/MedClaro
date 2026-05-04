import { Card } from "@/components/ui/card";

export default function ReportLoading() {
  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded-full bg-mist" />
        <div className="h-12 w-72 animate-pulse rounded-3xl bg-mist" />
        <div className="h-28 animate-pulse rounded-[28px] bg-mist" />
      </Card>
      <Card className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded-full bg-mist" />
        <div className="h-32 animate-pulse rounded-[28px] bg-mist" />
        <p className="text-sm text-[#5b7686]">AI is reading your report...</p>
      </Card>
    </div>
  );
}
