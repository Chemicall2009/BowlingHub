import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center text-center p-6">
      <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 mb-4">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-extrabold text-white">404 - Страница не найдена</h1>
      <p className="text-sm text-zinc-400 max-w-md mt-2 mb-6">
        Запрошенный раздел или дорожка не существует либо была удалена из конфигурации клуба.
      </p>
      <Button onClick={() => navigate("/")} className="gap-2 bg-emerald-600 hover:bg-emerald-500">
        <ArrowLeft className="w-4 h-4" /> Вернуться на главную
      </Button>
    </div>
  );
}
