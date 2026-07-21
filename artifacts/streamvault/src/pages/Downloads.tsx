import { Link } from "wouter";
import { Download, FolderOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export default function Downloads() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#06060a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#06060a]/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center gap-3">
        <Link href="/">
          <button className="text-white/60 hover:text-white transition-colors p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <Download className="w-5 h-5 text-[#c9a227]" />
        <h1 className="text-lg font-bold text-white">التحميلات</h1>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
        {/* Big icon illustration */}
        <div className="relative mb-8">
          <FolderOpen
            className="w-40 h-40 text-white"
            style={{ opacity: 0.20 }}
          />
          <div className="absolute inset-0 flex items-center justify-center pt-4">
            <Download
              className="w-14 h-14 text-[#c9a227]"
              style={{ opacity: 0.35 }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          لا توجد تحميلات حالياً
        </h2>
        <p className="text-white/50 text-base mb-10 max-w-xs leading-relaxed">
          ستظهر تحميلاتك هنا
        </p>

        {/* Gold gradient button */}
        <Link href="/">
          <Button
            className="px-8 py-3 text-base font-semibold rounded-xl text-black shadow-lg"
            style={{
              background: "linear-gradient(135deg, #c9a227 0%, #e8c547 50%, #c9a227 100%)",
            }}
          >
            تصفح المحتوى
          </Button>
        </Link>
      </div>

      {/* Note at bottom */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center px-4 pointer-events-none">
        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 max-w-sm w-full text-center">
          <p className="text-white/40 text-sm flex items-center justify-center gap-2">
            <Download className="w-4 h-4 text-[#c9a227]/60 flex-shrink-0" />
            ميزة التحميل متاحة في التطبيق الأصلي
          </p>
        </div>
      </div>
    </div>
  );
}
