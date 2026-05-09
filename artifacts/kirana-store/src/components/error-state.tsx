import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useLanguage } from "@/hooks/use-language";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className = "h-[40vh]" }: ErrorStateProps) {
  const { t } = useLanguage();

  return (
    <Card className={`border-dashed flex items-center justify-center ${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          {t("Something went wrong", "कुछ गलत हो गया")}
        </h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {message || t("We couldn't load the data. Please try again.", "हम डेटा लोड नहीं कर सके। कृपया पुनः प्रयास करें।")}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="h-11 px-6 border-[#cacbcf] hover:border-[#cacbcf]">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("Retry", "पुनः प्रयास करें")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
