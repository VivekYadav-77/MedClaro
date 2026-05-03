import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Card className="h-48 animate-pulse bg-mist" />
      <Card className="h-40 animate-pulse bg-mist" />
      <p className="text-sm text-[#5b7686]">AI is reading your report...</p>
    </div>
  );
}
