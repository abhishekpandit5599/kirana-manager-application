import { useState, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ScanLine, 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  ShoppingCart
} from "lucide-react";
import { useLocation } from "wouter";
import { useDispatch } from "react-redux";
import { setAiExtractedItems } from "@/store/slices/billingSlice";
import { processOcr } from "@/lib/api";

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  matchedItemId: string | null;
  matchedItemName: string | null;
  confidence: number;
}


export default function AiOcr() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const dispatch = useDispatch();
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawText, setRawText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Send to API via FormData
    setIsProcessing(true);
    setExtractedItems(null);
    
    try {
      const data = await processOcr(file);
      
      if (data && data.items && data.items.length > 0) {
        setExtractedItems(data.items);
        setRawText(data.rawText || "");
        toast({ title: t("List processed successfully!", "सूची सफलतापूर्वक स्कैन की गई!") });
      } else {
        toast({ variant: "destructive", title: t("Could not read list", "सूची पढ़ी नहीं जा सकी"), description: t("Try a clearer picture.", "स्पष्ट तस्वीर का प्रयास करें।") });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Error processing image", "तस्वीर प्रोसेस करने में त्रुटि"), description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setImagePreview(null);
    setExtractedItems(null);
    setRawText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addToBilling = () => {
    if (extractedItems) {
      dispatch(setAiExtractedItems(extractedItems));
      toast({ title: t("Items ready for billing!", "सामान बिलिंग के लिए तैयार!") });
      setLocation("/billing");
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ScanLine className="h-8 w-8 text-primary" />
            {t("AI Scan List", "सामान सूची स्कैन")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Upload a handwritten list or photo to extract items automatically", "हाथ से लिखी सूची या फोटो अपलोड करें")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-primary/20 overflow-hidden flex flex-col h-full min-h-[500px]">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <CardTitle>{t("Upload List", "सूची अपलोड करें")}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col items-center justify-center relative">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            {imagePreview ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <div className="relative w-full max-w-sm rounded-lg overflow-hidden border-2 border-primary shadow-md">
                  <img src={imagePreview} alt="Scanned list" className="w-full h-auto object-contain max-h-[400px]" />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <ScanLine className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="mt-4 font-bold text-lg animate-pulse text-primary">{t("Analyzing your list...", "आपकी सूची पढ़ी जा रही है...")}</p>
                    </div>
                  )}
                </div>
                {rawText && (
                  <div className="w-full mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-bold text-muted-foreground mb-1">{t("Raw Text Detected:", "पहचाना गया टेक्स्ट:")}</p>
                    <p className="text-sm whitespace-pre-wrap">{rawText}</p>
                  </div>
                )}
                {!isProcessing && (
                  <Button variant="outline" className="mt-6 h-12" onClick={resetScanner}>
                    <X className="mr-2 h-5 w-5" />
                    {t("Scan Another", "दूसरा स्कैन करें")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
                  <Camera className="h-16 w-16 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{t("Take a photo of a handwritten list", "हाथ से लिखी सूची की फोटो लें")}</h3>
                  <p className="text-muted-foreground">{t("We'll automatically extract the items and quantities.", "हम स्वचालित रूप से सामान और मात्रा निकाल लेंगे।")}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
                  <Button 
                    className="flex-1 h-16 text-lg font-bold shadow-lg" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-6 w-6" />
                    {t("Take Photo", "फोटो लें")}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-16 text-lg font-bold"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-6 w-6" />
                    {t("Upload Image", "तस्वीर अपलोड करें")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg h-full flex flex-col">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-secondary" />
              {t("Extracted Items", "निकाला गया सामान")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto">
            {!imagePreview ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-50">
                <FileText className="h-16 w-16 mb-4" />
                <p className="text-lg">{t("Extracted items will appear here.", "निकाला गया सामान यहाँ दिखाई देगा।")}</p>
              </div>
            ) : isProcessing ? (
              <div className="h-full flex items-center justify-center p-8">
                <div className="space-y-4 w-full max-w-sm">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-20 bg-muted/50 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              </div>
            ) : extractedItems && extractedItems.length > 0 ? (
              <div className="divide-y">
                {extractedItems.map((item, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-lg text-foreground">{item.name}</h4>
                      <p className="text-muted-foreground font-medium mt-1">
                        {item.quantity} {item.unit}
                      </p>
                      {item.matchedItemName && (
                        <p className="text-xs text-muted-foreground mt-0.5">→ {item.matchedItemName} ({Math.round(item.confidence * 100)}%)</p>
                      )}
                    </div>
                    <div className="text-right">
                      {item.matchedItemId ? (
                        <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {t("In Stock", "स्टॉक में")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {t("Not Found", "नहीं मिला")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-destructive">
                <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                <p>{t("No items could be extracted from this image.", "इस तस्वीर से कोई सामान नहीं निकाला जा सका।")}</p>
              </div>
            )}
          </CardContent>
          {extractedItems && extractedItems.length > 0 && (
            <CardFooter className="p-4 border-t bg-muted/20">
              <Button className="w-full h-14 text-lg font-bold" onClick={addToBilling}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t("Add all to Bill", "सभी को बिल में जोड़ें")}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
