import { useState, useRef, useCallback } from "react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mic, 
  Square,
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Waves,
  ShoppingCart,
  RotateCcw
} from "lucide-react";
import { useLocation } from "wouter";
import { useDispatch } from "react-redux";
import { setAiExtractedItems } from "@/store/slices/billingSlice";
import { processVoice } from "@/lib/api";

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  matchedItemId: string | null;
  matchedItemName: string | null;
  confidence: number;
}


// Check for Speech Recognition API
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function AiVoice() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const dispatch = useDispatch();
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: t("Not Supported", "समर्थित नहीं"), description: t("Speech recognition is not supported in this browser. Please use Chrome.", "यह ब्राउज़र स्पीच रिकग्निशन को सपोर्ट नहीं करता। कृपया Chrome का उपयोग करें।") });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      if (event.error !== "no-speech") {
        toast({ variant: "destructive", title: t("Microphone Error", "माइक त्रुटि"), description: event.error });
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setExtractedItems(null);
  }, [language, toast, t]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      if (transcript.trim()) {
        processTranscript(transcript);
      }
    } else {
      setTranscript("");
      startRecording();
    }
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const data = await processVoice(text);
      
      if (data && data.items && data.items.length > 0) {
        setExtractedItems(data.items);
        toast({ title: t("Voice processed successfully!", "आवाज़ सफलतापूर्वक प्रोसेस की गई!") });
      } else {
        toast({ variant: "destructive", title: t("Could not extract items", "सामान निकाला नहीं जा सका"), description: t("Please speak clearly with item names and quantities.", "कृपया सामान के नाम और मात्रा स्पष्ट रूप से बोलें।") });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Error processing voice", "आवाज़ प्रोसेस करने में त्रुटि"), description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setTranscript("");
    setExtractedItems(null);
    if (isRecording) stopRecording();
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
            <Mic className="h-8 w-8 text-primary" />
            {t("AI Voice Order", "आवाज़ से बिल बनाएं")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Just speak the items and we will add them to the bill", "बस सामान बोलें और हम उन्हें बिल में जोड़ देंगे")}
          </p>
        </div>
        {(transcript || extractedItems) && (
          <Button variant="outline" onClick={resetAll}>
            <RotateCcw className="mr-2 h-4 w-4" /> {t("Reset", "रीसेट")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-primary/20 overflow-hidden flex flex-col h-full min-h-[500px]">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <CardTitle className="flex items-center justify-between">
              <span>{t("Voice Input", "आवाज़ इनपुट")}</span>
              {!SpeechRecognition && (
                <Badge variant="destructive" className="text-xs">{t("Use Chrome", "Chrome उपयोग करें")}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col items-center justify-center">
            
            <div className="w-full flex-1 flex flex-col items-center justify-center mb-8">
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="icon"
                className={`w-40 h-40 rounded-full shadow-2xl transition-all duration-300 ${isRecording ? 'animate-pulse ring-8 ring-destructive/30' : 'hover:scale-105'}`}
                onClick={toggleRecording}
                disabled={!SpeechRecognition && !transcript}
              >
                {isRecording ? (
                  <Square className="h-16 w-16" />
                ) : (
                  <Mic className="h-16 w-16" />
                )}
              </Button>
              
              <div className="mt-8 text-center h-12">
                {isRecording ? (
                  <div className="flex items-center gap-2 text-destructive font-bold text-xl">
                    <Waves className="animate-pulse" />
                    {t("Listening... Tap to stop", "सुन रहे हैं... रोकने के लिए टैप करें")}
                  </div>
                ) : (
                  <p className="text-xl font-bold text-muted-foreground">
                    {t("Tap microphone to start speaking", "बोलना शुरू करने के लिए माइक टैप करें")}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase">{t("Transcript", "बोला गया टेक्स्ट")}</label>
              <Textarea 
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="h-32 text-lg resize-none bg-muted/50 border-primary/20"
                placeholder={t("Your speech will appear here... You can also type manually.\nExample: 2 kg sugar, 5 kg rice, 1 litre oil", "आपकी आवाज़ यहाँ दिखाई देगी... आप टाइप भी कर सकते हैं।\nउदाहरण: 2 किलो चीनी, 5 किलो चावल, 1 लीटर तेल")}
              />
              {!isRecording && transcript && !extractedItems && !isProcessing && (
                <Button className="w-full mt-2" onClick={() => processTranscript(transcript)}>
                  {t("Process Text", "टेक्स्ट प्रोसेस करें")}
                </Button>
              )}
            </div>

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
            {isProcessing ? (
              <div className="h-full flex flex-col items-center justify-center p-8">
                 <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <Mic className="h-8 w-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="font-bold text-lg text-primary animate-pulse">{t("Understanding speech...", "आवाज़ समझी जा रही है...")}</p>
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
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-50">
                <FileText className="h-16 w-16 mb-4" />
                <p className="text-lg">{t("Extracted items will appear here.", "निकाला गया सामान यहाँ दिखाई देगा।")}</p>
                <p className="text-sm mt-2">{t("Try saying:", "बोलकर देखें:")}</p>
                <p className="text-sm font-medium text-foreground mt-1">"2 kg sugar, 5 kg rice, 1 litre oil"</p>
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
