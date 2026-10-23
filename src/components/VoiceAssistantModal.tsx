import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  Square, 
  X, 
  Sparkles, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRight, 
  Globe, 
  Bot, 
  ExternalLink,
  MapPin,
  CloudSun,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { 
  SupportedLanguage, 
  UserRole, 
  FarmerProfile, 
  BuyerProfile, 
  NavigationTab,
  CropRecord,
  WeatherDataState 
} from '../types';
import { LANGUAGES } from '../constants/translations';
import { voiceService, VoiceState, TtsState } from '../services/voiceService';
import { advisorService } from '../services/advisorService';
import { weatherService } from '../services/weatherService';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  role: UserRole;
  profile?: FarmerProfile;
  buyerProfile?: BuyerProfile;
  crops?: CropRecord[];
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenFertilizerModal: (cropName?: string) => void;
}

interface AssistantExchange {
  id: string;
  userQuery: string;
  replyText: string;
  timestamp: string;
  routedAction?: {
    label: string;
    action: () => void;
  };
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  role,
  profile,
  buyerProfile,
  crops = [],
  onNavigateTab,
  onOpenFertilizerModal,
}) => {
  // Voice Input State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  // Audio Response / TTS State
  const [ttsState, setTtsState] = useState<TtsState>('idle');
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState<boolean>(true);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);

  // Assistant Conversation History
  const [exchanges, setExchanges] = useState<AssistantExchange[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Live Weather Context
  const [liveWeather, setLiveWeather] = useState<{
    temperature: number;
    weatherDescription: string;
    humidity: number;
    windSpeed: number;
    precipitationProbability: number;
  } | null>(null);

  const activeRecognitionRef = useRef<{ stop: () => void; cancel: () => void } | null>(null);
  const transcriptInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const locationDisplay =
    role === 'farmer'
      ? `${profile?.villageOrDistrict || 'Vijayapura'}, ${profile?.state || 'Karnataka'}`
      : `${buyerProfile?.location || 'Vijayapura APMC'}, ${buyerProfile?.state || 'Karnataka'}`;

  // Fetch live weather context on mount/location change to ground agronomic answers
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      try {
        const geo = await weatherService.geocodeCity(locationDisplay.split(',')[0]);
        const w = await weatherService.fetchLiveWeather(geo.latitude, geo.longitude, geo.locationName);
        if (isMounted && w?.current) {
          setLiveWeather({
            temperature: w.current.temperature,
            weatherDescription: w.current.weatherDescription,
            humidity: w.current.humidity,
            windSpeed: w.current.windSpeed,
            precipitationProbability: w.current.precipitationProbability,
          });
        }
      } catch {
        // Optional context
      }
    };
    if (isOpen) {
      loadWeather();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, locationDisplay]);

  // Recognition availability check
  const isRecognitionSupported = voiceService.isRecognitionSupported();
  const isTtsSupported = voiceService.isTtsSupported();

  const handleStopListening = () => {
    if (activeRecognitionRef.current) {
      activeRecognitionRef.current.stop();
      activeRecognitionRef.current = null;
    }
    voiceService.stopListening();
    setVoiceState((prev) => (prev === 'listening' ? 'review' : prev));
  };

  const handleCancelListening = () => {
    if (activeRecognitionRef.current) {
      activeRecognitionRef.current.cancel();
      activeRecognitionRef.current = null;
    }
    voiceService.cancelListening();
    setInterimTranscript('');
    setVoiceState('idle');
  };

  // Clean up speech recognition & TTS when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (activeRecognitionRef.current) {
        activeRecognitionRef.current.stop();
        activeRecognitionRef.current = null;
      }
      voiceService.stopListening();
      voiceService.stopSpeaking();
      setTtsState('idle');
    }
  }, [isOpen]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (activeRecognitionRef.current) {
        activeRecognitionRef.current.stop();
        activeRecognitionRef.current = null;
      }
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

  // Auto-scroll chat area
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exchanges, isThinking, voiceState]);

  if (!isOpen) return null;

  // Handle Starting Speech Recognition with Mic Permission Flow
  const handleStartListening = async () => {
    setErrorMessage(null);
    setIsPermissionDenied(false);

    if (!isRecognitionSupported) {
      setErrorMessage(
        'Speech recognition is not supported in this browser. You can type your request directly into the box below.'
      );
      setVoiceState('error');
      return;
    }

    setVoiceState('requesting-permission');

    // Verify / request microphone permission
    const permission = await voiceService.requestMicrophonePermission();
    if (!permission.granted) {
      setIsPermissionDenied(true);
      setErrorMessage(permission.error || 'Microphone access was denied. Please allow microphone permissions in your browser.');
      setVoiceState('error');
      return;
    }

    // Stop any existing TTS before listening
    voiceService.stopSpeaking();
    setTtsState('idle');

    setVoiceState('listening');
    setInterimTranscript('');

    const controller = voiceService.startListening(language, {
      onStart: () => {
        setVoiceState('listening');
      },
      onInterim: (text) => {
        setInterimTranscript(text);
      },
      onFinal: (finalText) => {
        setTranscript(finalText);
        setInterimTranscript('');
        setVoiceState('review');
      },
      onError: (errMsg, isDenied) => {
        setErrorMessage(errMsg);
        if (isDenied) setIsPermissionDenied(true);
        setVoiceState('error');
      },
      onEnd: () => {
        activeRecognitionRef.current = null;
        setVoiceState((prev) => (prev === 'listening' ? 'review' : prev));
      },
    });

    activeRecognitionRef.current = controller;
  };

  // Evaluate Query & Route to existing AgriConnect features or AI Advisor
  const handleSubmitQuery = async (queryToSubmit?: string) => {
    const rawQuery = (queryToSubmit !== undefined ? queryToSubmit : transcript).trim();
    if (!rawQuery) return;

    // Stop any active speech recognition
    handleStopListening();
    voiceService.stopSpeaking();
    setTtsState('idle');

    setTranscript('');
    setInterimTranscript('');
    setVoiceState('idle');
    setErrorMessage(null);
    setIsThinking(true);

    const queryLower = rawQuery.toLowerCase();

    // 1. CLARIFICATION CHECK (Ambiguous or inaudible query)
    if (rawQuery.length <= 2 || /^(uh|um|hello|hi|hey|what|test)$/i.test(rawQuery)) {
      const clarification =
        language === 'hi'
          ? `मैंने सुना "${rawQuery}"। क्या आप अपनी फसल, मौसम या मंडी से जुड़ा सवाल पूछना चाहते हैं? कृपया पूरा सवाल बोलें या नीचे लिखें।`
          : `I heard "${rawQuery}". Could you please clarify your agricultural question? You can ask about crop diseases, weather conditions, soil scanning, fertilizer recommendations, or mandi prices.`;
      
      const exchange: AssistantExchange = {
        id: `exch-${Date.now()}`,
        userQuery: rawQuery,
        replyText: clarification,
        timestamp: new Date().toISOString(),
      };

      setExchanges((prev) => [...prev, exchange]);
      setIsThinking(false);

      if (autoSpeakEnabled) {
        speakResponse(clarification);
      }
      return;
    }

    // 2. FEATURE ROUTING INTENT RECOGNITION
    // Navigation / Screen routing:
    // A. My Farm / Crops
    if (
      queryLower.includes('my farm') ||
      queryLower.includes('mera khet') ||
      queryLower.includes('show crops') ||
      queryLower.includes('crops') ||
      queryLower.includes('field records') ||
      queryLower.includes('खेत') ||
      queryLower.includes('फसल')
    ) {
      const cropList = crops.length > 0 ? crops.map((c) => c.name).join(', ') : 'No crops registered yet';
      const reply =
        language === 'hi'
          ? `आपके खेत में दर्ज फसलें हैं: ${cropList}। क्या आप 'मेरा खेत' स्क्रीन खोलना चाहते हैं?`
          : `Opening your farm records. You currently have ${crops.length} registered crop(s): ${cropList}.`;

      const exchange: AssistantExchange = {
        id: `exch-${Date.now()}`,
        userQuery: rawQuery,
        replyText: reply,
        timestamp: new Date().toISOString(),
        routedAction: {
          label: 'Open My Farm Screen',
          action: () => {
            onClose();
            onNavigateTab('my-farm');
          },
        },
      };

      setExchanges((prev) => [...prev, exchange]);
      setIsThinking(false);
      if (autoSpeakEnabled) speakResponse(reply);
      return;
    }

    // B. Scan / Soil / Leaf Photo
    if (
      queryLower.includes('scan') ||
      queryLower.includes('camera') ||
      queryLower.includes('photo') ||
      queryLower.includes('leaf') ||
      queryLower.includes('disease') ||
      queryLower.includes('doctor') ||
      queryLower.includes('जांच') ||
      queryLower.includes('स्कैन')
    ) {
      const isPlant = queryLower.includes('leaf') || queryLower.includes('plant') || queryLower.includes('disease') || queryLower.includes('doctor') || queryLower.includes('पत्ता') || queryLower.includes('बीमारी');
      const reply =
        language === 'hi'
          ? `आप AgriConnect के स्कैन स्क्रीन पर अपने फोन के कैमरे से ${isPlant ? 'पत्तियों' : 'मिट्टी'} की फोटो लेकर तुरंत AI जांच कर सकते हैं।`
          : `You can use AgriConnect Scan to photograph ${isPlant ? 'plant leaves for disease and symptom detection' : 'soil surface for texture analysis'}. Launching Scan screen.`;

      const exchange: AssistantExchange = {
        id: `exch-${Date.now()}`,
        userQuery: rawQuery,
        replyText: reply,
        timestamp: new Date().toISOString(),
        routedAction: {
          label: `Open ${isPlant ? 'Plant' : 'Soil'} Scan Screen`,
          action: () => {
            onClose();
            onNavigateTab('soil-scan');
          },
        },
      };

      setExchanges((prev) => [...prev, exchange]);
      setIsThinking(false);
      if (autoSpeakEnabled) speakResponse(reply);
      return;
    }

    // C. Fertilizer Guidance
    if (
      queryLower.includes('fertilizer') ||
      queryLower.includes('urea') ||
      queryLower.includes('dap') ||
      queryLower.includes('nutrient') ||
      queryLower.includes('npk') ||
      queryLower.includes('खाद') ||
      queryLower.includes('उर्वरक')
    ) {
      const reply =
        language === 'hi'
          ? `उर्वरक सलाह आपके विकास चरण पर आधारित होती है। अपनी फसल के लिए सटीक खाद तालिका देखने के लिए नीचे दिए गए बटन पर टैप करें।`
          : `Balanced nutrition depends on growth stage and soil tests. You can view evidence-based fertilizer recommendations tailored to your crops below.`;

      const exchange: AssistantExchange = {
        id: `exch-${Date.now()}`,
        userQuery: rawQuery,
        replyText: reply,
        timestamp: new Date().toISOString(),
        routedAction: {
          label: 'Open Fertilizer Guidance Tool',
          action: () => {
            onClose();
            onOpenFertilizerModal();
          },
        },
      };

      setExchanges((prev) => [...prev, exchange]);
      setIsThinking(false);
      if (autoSpeakEnabled) speakResponse(reply);
      return;
    }

    // D. Marketplace / Mandi Prices
    if (
      queryLower.includes('market') ||
      queryLower.includes('mandi') ||
      queryLower.includes('price') ||
      queryLower.includes('rate') ||
      queryLower.includes('sell') ||
      queryLower.includes('buy') ||
      queryLower.includes('मंडी') ||
      queryLower.includes('भाव') ||
      queryLower.includes('दाम')
    ) {
      const reply =
        language === 'hi'
          ? `AgriConnect मंडी बाजार में आप स्थानीय APMC भाव देख सकते हैं और अपनी उपज सूचीबद्ध कर सकते हैं।`
          : `In AgriConnect Marketplace, you can explore regional APMC modal rates, direct grower harvests, and submit purchase enquiries.`;

      const exchange: AssistantExchange = {
        id: `exch-${Date.now()}`,
        userQuery: rawQuery,
        replyText: reply,
        timestamp: new Date().toISOString(),
        routedAction: {
          label: role === 'buyer' ? 'Browse Crop Lots' : 'Open Marketplace',
          action: () => {
            onClose();
            onNavigateTab(role === 'buyer' ? 'browse-crops' : 'marketplace');
          },
        },
      };

      setExchanges((prev) => [...prev, exchange]);
      setIsThinking(false);
      if (autoSpeakEnabled) speakResponse(reply);
      return;
    }

    // E. Weather Query
    if (
      queryLower.includes('weather') ||
      queryLower.includes('rain') ||
      queryLower.includes('temp') ||
      queryLower.includes('wind') ||
      queryLower.includes('मौसम') ||
      queryLower.includes('बारिश')
    ) {
      let weatherSpeech = '';
      if (liveWeather) {
        weatherSpeech =
          language === 'hi'
            ? `${locationDisplay} में वर्तमान तापमान ${liveWeather.temperature}°C है, स्थिति: ${liveWeather.weatherDescription}, आर्द्रता: ${liveWeather.humidity}%, और हवा की गति: ${liveWeather.windSpeed} किमी/घंटा है। बारिश की संभावना: ${liveWeather.precipitationProbability}% है।`
            : `Current weather in ${locationDisplay} from Open-Meteo is ${liveWeather.temperature}°C, ${liveWeather.weatherDescription}. Humidity is ${liveWeather.humidity}%, wind speed is ${liveWeather.windSpeed} km/h, with a ${liveWeather.precipitationProbability}% chance of rain.`;
      } else {
        weatherSpeech =
          language === 'hi'
            ? `मौसम का विवरण देखने के लिए आप होम स्क्रीन पर लाइव मौसम विजेट देख सकते हैं।`
            : `You can check live weather and hourly forecast directly on the Home dashboard.`;
      }

      const exchange: AssistantExchange = {
        id: `exch-${Date.now()}`,
        userQuery: rawQuery,
        replyText: weatherSpeech,
        timestamp: new Date().toISOString(),
        routedAction: {
          label: 'View Full Weather Forecast',
          action: () => {
            onClose();
            onNavigateTab('home');
          },
        },
      };

      setExchanges((prev) => [...prev, exchange]);
      setIsThinking(false);
      if (autoSpeakEnabled) speakResponse(weatherSpeech);
      return;
    }

    // 3. GENERAL AGRONOMIC & FARMING INQUIRY -> /api/advisor-chat
    try {
      const messagesPayload = [
        ...exchanges.flatMap((e) => [
          { role: 'user' as const, content: e.userQuery },
          { role: 'assistant' as const, content: e.replyText },
        ]),
        { role: 'user' as const, content: rawQuery },
      ];

      const res = await advisorService.consultAdvisor({
        messages: messagesPayload,
        weatherContext: liveWeather || undefined,
        locationContext: locationDisplay,
        language,
      });

      if (!res.success || !res.reply) {
        throw new Error(res.error || 'No reply received from AgriConnect Advisor.');
      }

      const exchange: AssistantExchange = {
        id: `exch-${Date.now()}`,
        userQuery: rawQuery,
        replyText: res.reply,
        timestamp: new Date().toISOString(),
      };

      setExchanges((prev) => [...prev, exchange]);
      if (autoSpeakEnabled) {
        speakResponse(res.reply);
      }
    } catch (err: any) {
      const fallbackReply =
        language === 'hi'
          ? `क्षमा करें, इस समय सलाहकार सेवा से संपर्क नहीं हो पाया (${err.message || 'नेटवर्क त्रुटि'})। कृपया अपना प्रश्न दोबारा पूछें।`
          : `I could not complete your advisory request right now: ${err.message || 'Network error'}. Please try again or check your internet connection.`;

      const exchange: AssistantExchange = {
        id: `exch-${Date.now()}`,
        userQuery: rawQuery,
        replyText: fallbackReply,
        timestamp: new Date().toISOString(),
      };

      setExchanges((prev) => [...prev, exchange]);
      if (autoSpeakEnabled) {
        speakResponse(fallbackReply);
      }
    } finally {
      setIsThinking(false);
    }
  };

  // Speak Response with Real Text-to-Speech
  const speakResponse = (text: string) => {
    setCurrentlySpeakingText(text);
    voiceService.speakText(text, language, (state) => {
      setTtsState(state);
      if (state === 'idle') {
        setCurrentlySpeakingText(null);
      }
    });
  };

  const handlePauseSpeech = () => {
    voiceService.pauseSpeaking();
  };

  const handleResumeSpeech = () => {
    voiceService.resumeSpeaking();
  };

  const handleStopSpeech = () => {
    voiceService.stopSpeaking();
    setCurrentlySpeakingText(null);
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Quick suggestion prompts based on role
  const quickSuggestions =
    role === 'farmer'
      ? [
          'Can I spray pesticide in today’s weather?',
          'Why are my wheat leaf tips yellowing?',
          'Show my registered crop plots',
          'Open plant leaf scanner',
        ]
      : [
          'What are today’s APMC onion and wheat prices?',
          'Browse available verified harvest lots',
          'Check my submitted purchase enquiries',
          'What is the standard moisture for wheat?',
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#d6e4cf] overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-assistant-title"
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#14492a] to-[#0c361e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300 border border-white/20 shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 id="voice-assistant-title" className="text-sm sm:text-base font-bold font-display tracking-tight truncate">
                  AgriConnect Voice Assistant
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 shrink-0">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 truncate">
                Speak naturally in {currentLangObj.localLabel} ({currentLangObj.label})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Auto-read speech toggle */}
            <button
              onClick={() => {
                const next = !autoSpeakEnabled;
                setAutoSpeakEnabled(next);
                if (!next) handleStopSpeech();
              }}
              className={`p-2 rounded-xl transition text-xs flex items-center gap-1 cursor-pointer ${
                autoSpeakEnabled
                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
              title={autoSpeakEnabled ? 'Spoken responses enabled' : 'Spoken responses muted'}
              aria-label="Toggle auto spoken responses"
            >
              {autoSpeakEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close Voice Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Location & Language Bar */}
        <div className="px-4 py-2 bg-[#f4f8f1] border-b border-[#e2edd0] flex items-center justify-between text-xs text-slate-700 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate font-medium text-slate-600">{locationDisplay}</span>
            {liveWeather && (
              <span className="text-emerald-800 font-semibold hidden xs:inline">
                • {liveWeather.temperature}°C, {liveWeather.weatherDescription}
              </span>
            )}
          </div>

          {/* Language selector inside voice assistant */}
          <div className="flex items-center gap-1 shrink-0">
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="text-[11px] font-bold bg-white border border-[#d2e2cb] rounded-lg px-2 py-0.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              aria-label="Speech recognition language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.localLabel} ({l.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fafcfa]">
          {/* Welcome Card if no messages yet */}
          {exchanges.length === 0 && voiceState !== 'listening' && (
            <div className="p-4 rounded-3xl bg-white border border-[#dce8d5] shadow-2xs space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 border border-emerald-300 flex items-center justify-center mx-auto text-[#124429]">
                <Bot className="w-6 h-6 text-emerald-800" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#144225] font-display">
                  Namaste! Tap the microphone and speak.
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Ask any question about crop health, spray timing, soil testing, market prices, or say "Open My Farm" or "Scan Plant".
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="pt-2 text-left space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Try asking aloud:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {quickSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmitQuery(s)}
                      className="p-2.5 rounded-xl bg-[#f8faf6] hover:bg-[#edf5e9] border border-[#dce8d5] hover:border-emerald-500 text-xs text-slate-700 text-left transition font-medium cursor-pointer shadow-2xs"
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Render exchanges */}
          {exchanges.map((exch) => (
            <div key={exch.id} className="space-y-2 animate-in fade-in">
              {/* User question bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-xs p-3 bg-[#14492a] text-white text-xs leading-relaxed shadow-2xs">
                  <span className="font-semibold">{exch.userQuery}</span>
                </div>
              </div>

              {/* Assistant response card */}
              <div className="flex justify-start">
                <div className="max-w-[92%] sm:max-w-[88%] rounded-2xl rounded-bl-xs p-4 bg-white border border-[#dce8d5] text-xs text-slate-800 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-[#144225]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>AgriConnect Advice</span>
                    </div>

                    {/* Audio Player Controls for this reply */}
                    {isTtsSupported && (
                      <div className="flex items-center gap-1 bg-[#f4f8f1] px-2 py-1 rounded-xl border border-[#dce8d5]">
                        {ttsState === 'speaking' && currentlySpeakingText === exch.replyText ? (
                          <>
                            <button
                              onClick={handlePauseSpeech}
                              className="p-1 text-emerald-800 hover:text-emerald-950 cursor-pointer"
                              title="Pause speech"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleStopSpeech}
                              className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                              title="Stop speech"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-bold text-emerald-700 animate-pulse">
                              Speaking...
                            </span>
                          </>
                        ) : ttsState === 'paused' && currentlySpeakingText === exch.replyText ? (
                          <>
                            <button
                              onClick={handleResumeSpeech}
                              className="p-1 text-emerald-800 hover:text-emerald-950 cursor-pointer"
                              title="Resume speech"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleStopSpeech}
                              className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                              title="Stop speech"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-bold text-slate-500">
                              Paused
                            </span>
                          </>
                        ) : (
                          <button
                            onClick={() => speakResponse(exch.replyText)}
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                            title="Listen aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Listen</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Clean Formatted Text Response */}
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-normal">
                    {exch.replyText}
                  </div>

                  {/* Action Navigation Button if applicable */}
                  {exch.routedAction && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={exch.routedAction.action}
                        className="w-full py-2 px-3 rounded-xl bg-[#edf5eb] hover:bg-[#e1eedc] text-[#14492a] font-bold text-xs transition flex items-center justify-between cursor-pointer"
                      >
                        <span>{exch.routedAction.label}</span>
                        <ArrowRight className="w-4 h-4 text-emerald-700" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking / Processing Spinner */}
          {isThinking && (
            <div className="flex items-start gap-2 animate-in fade-in">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="p-3 bg-white border border-[#dce8d5] rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-2 text-xs text-slate-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] font-medium text-slate-500">Checking agricultural knowledge...</span>
              </div>
            </div>
          )}

          {/* Active Listening Visualizer Banner */}
          {voiceState === 'listening' && (
            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-50 to-[#edf7ea] border border-emerald-300 text-center space-y-2.5 animate-in fade-in">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                {/* Pulsing ripple rings */}
                <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <span className="absolute inset-1 rounded-full bg-emerald-500/30 animate-pulse" />
                <div className="relative w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md">
                  <Mic className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Listening in {currentLangObj.localLabel}...
                </span>
                <p className="text-[11px] text-emerald-700">
                  Speak naturally into your device microphone
                </p>
              </div>

              {/* Real-time interim preview with screen reader support */}
              {interimTranscript && (
                <div 
                  className="p-2.5 bg-white/90 rounded-2xl border border-emerald-200 text-xs text-slate-800 font-semibold italic"
                  role="status"
                  aria-live="polite"
                >
                  "{interimTranscript}..."
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleStopListening}
                  className="px-4 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition cursor-pointer shadow-xs min-h-[44px] flex items-center justify-center"
                >
                  Done Speaking
                </button>
                <button
                  type="button"
                  onClick={handleCancelListening}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Review State Card (when speech is recognized) */}
          {voiceState === 'review' && transcript && (
            <div 
              className="p-4 rounded-3xl bg-white border-2 border-emerald-500 shadow-sm space-y-3 animate-in fade-in"
              role="region"
              aria-label="Recognized speech review"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#144225] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Recognized Words (Review & Confirm):</span>
                </span>
                <button
                  onClick={() => {
                    setTranscript('');
                    setVoiceState('idle');
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
                  title="Clear"
                  aria-label="Clear recognized text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Editable transcript review input */}
              <div className="relative">
                <input
                  ref={transcriptInputRef}
                  type="text"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[#f8faf6] border border-[#cfe2ca] text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  placeholder="Review or edit recognized speech..."
                  aria-label="Review or edit recognized speech text"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmitQuery()}
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#14492a] hover:bg-[#0f3820] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartListening}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#edf5eb] hover:bg-[#e1eedc] text-[#14492a] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Speak again"
                  aria-label="Speak again"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Re-speak</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div 
              className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs space-y-2"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Voice Notice</span>
              </div>
              <p className="leading-relaxed text-[11px]">{errorMessage}</p>
              {isPermissionDenied && (
                <p className="text-[10px] text-red-700 italic">
                  Tip: Look for the microphone lock icon in your browser address bar and choose "Allow".
                </p>
              )}
            </div>
          )}

          <div ref={chatScrollRef} />
        </div>

        {/* Bottom Control Bar: Big Mic Action & Text Input Fallback */}
        <div className="p-3.5 bg-white border-t border-[#e2ebd9] shrink-0 space-y-2.5">
          {/* Main Action Strip: Primary Mic Trigger & Text fallback */}
          <div className="flex items-center gap-2">
            {/* Main Microphone Button */}
            <button
              type="button"
              onClick={voiceState === 'listening' ? handleStopListening : handleStartListening}
              className={`p-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0 min-h-[46px] min-w-[46px] ${
                voiceState === 'listening'
                  ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                  : 'bg-[#14492a] text-white hover:bg-[#0f3820] active:scale-95'
              }`}
              aria-label={voiceState === 'listening' ? 'Stop Listening' : 'Start Voice Input'}
              title={voiceState === 'listening' ? 'Stop Listening' : 'Tap to Speak'}
            >
              {voiceState === 'listening' ? (
                <>
                  <Square className="w-4 h-4" />
                  <span className="hidden sm:inline">Stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-emerald-300" />
                  <span className="hidden sm:inline">Tap to Speak</span>
                </>
              )}
            </button>

            {/* Always Available Written Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitQuery();
              }}
              className="flex-1 flex items-center gap-1.5 min-w-0"
            >
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Or type crop query or feature name..."
                disabled={voiceState === 'listening' || isThinking}
                className="flex-1 px-3.5 py-2.5 bg-[#f6f9f3] border border-[#d4e4cc] rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 font-medium min-w-0 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!transcript.trim() || isThinking}
                className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#14492a] hover:bg-[#0f3820] active:scale-95 text-white transition disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 text-xs font-bold shadow-2xs shrink-0 cursor-pointer min-h-[42px]"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Free browser speech API • No audio recordings uploaded</span>
            <span>Language: {currentLangObj.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
