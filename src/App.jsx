import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster, toast } from "sonner"

export default function App() {
  return (
    
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 p-4">
      <Toaster position="top-right" richColors />
      {/* Tiêu đề Tailwind */}
      <h1 className="text-4xl font-bold text-primary">
        ReactJS + Tailwindcss + Shadcn/ui 
      </h1>

      {/* Nút shadcn */}
      <Button onClick={() => toast.success('Primary button clicked')} className="bg-primary text-white hover:bg-primary/90">
        Nút Primary
      </Button>

      <Button onClick={() => toast.error('Secondary button clicked')} className="bg-secondary text-white hover:bg-secondary/90">
        Nút Secondary
      </Button>

    </div>
  )
}