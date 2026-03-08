export default function BarChartSkeleton() {
  return (
    <div className="h-[300px] w-full px-16 py-4">
      <div className="h-full w-full rounded-lg border border-gray-100 bg-gray-50 p-4 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 font-poppins">
          <span className="inline-block h-5 w-5 rounded-full border-2 border-gray-300 border-t-[#212560] animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    </div>
  );
}
