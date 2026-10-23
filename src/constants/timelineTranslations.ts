import { SupportedLanguage } from '../types';

export interface TimelineTranslationStrings {
  title: string;
  subtitle: string;
  completedStages: string;
  currentStage: string;
  upcomingStages: string;
  nextAction: string;
  markCompleted: string;
  completed: string;
  incomplete: string;
  editDetails: string;
  cropNameLabel: string;
  varietyLabel: string;
  sowingDateLabel: string;
  farmingMethodLabel: string;
  growingRegionLabel: string;
  currentStageLabel: string;
  saveChanges: string;
  cancel: string;
  estimatedDatesNotice: string;
  noSowingDateNotice: string;
  safetyWarningTitle: string;
  safetyWarningBody: string;
  remindMe: string;
  reminderSet: string;
  listenAction: string;
  daysAfterSowing: string;
  estimatedProgress: string;
  whyItMatters: string;
  weatherAdjustment: string;
  categories: {
    irrigation: string;
    nutrient: string;
    weed: string;
    pest_disease: string;
    field_inspection: string;
    harvest: string;
  };
}

export const TIMELINE_TRANSLATIONS: Record<SupportedLanguage, TimelineTranslationStrings> = {
  en: {
    title: 'Interactive Crop Timeline',
    subtitle: 'Stage-by-stage agronomic milestones, weather-aware actions & expert guidance',
    completedStages: 'Completed Stages',
    currentStage: 'Current Active Stage',
    upcomingStages: 'Upcoming Stages',
    nextAction: 'Next Recommended Action',
    markCompleted: 'Mark Completed',
    completed: 'Done',
    incomplete: 'Pending',
    editDetails: 'Edit Crop Details',
    cropNameLabel: 'Crop Name',
    varietyLabel: 'Variety (Optional)',
    sowingDateLabel: 'Sowing / Transplanting Date',
    farmingMethodLabel: 'Farming Method',
    growingRegionLabel: 'Growing Region / District',
    currentStageLabel: 'Current Stage (Manual Override)',
    saveChanges: 'Save & Update Timeline',
    cancel: 'Cancel',
    estimatedDatesNotice: 'Calendar dates are estimated based on typical thermal time (GDD). In-field temperatures and rainfall will naturally adjust actual stage timing.',
    noSowingDateNotice: 'No planting date specified. Enter your sowing date to calculate calendar date ranges.',
    safetyWarningTitle: 'Spraying & Chemical Safety Notice',
    safetyWarningBody: 'Weather readings are informational aids and never guarantee safe chemical application. Verify in-field canopy wind gusts, morning dew, and product label instructions.',
    remindMe: 'Remind Me',
    reminderSet: 'Reminder Saved',
    listenAction: 'Listen to Stage Advice',
    daysAfterSowing: 'Days After Sowing (DAS)',
    estimatedProgress: 'Estimated Duration Progress',
    whyItMatters: '💡 Why this matters (Agronomic Reasoning):',
    weatherAdjustment: '🌦️ Weather-Aware Adjustment:',
    categories: {
      irrigation: '💧 Irrigation',
      nutrient: '🌱 Nutrition & Fertilizer',
      weed: '🌿 Weeding & Inter-culture',
      pest_disease: '🛡️ Pest & Disease Protection',
      field_inspection: '🔍 Field Scouting',
      harvest: '🌾 Harvest & Curing'
    }
  },
  kn: {
    title: 'ಬೆಳೆ ಬೆಳವಣಿಗೆಯ ಕಾಲಾವಧಿ (Crop Timeline)',
    subtitle: 'ಹಂತ-ಹಂತದ ಕೃಷಿ ಮೈಲಿಗಲ್ಲುಗಳು ಮತ್ತು ಹವಾಮಾನ ಆಧಾರಿತ ಶಿಫಾರಸುಗಳು',
    completedStages: 'ಪೂರ್ಣಗೊಂಡ ಹಂತಗಳು',
    currentStage: 'ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ ಹಂತ',
    upcomingStages: 'ಮುಂದಿನ ಹಂತಗಳು',
    nextAction: 'ಮುಂದಿನ ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ',
    markCompleted: 'ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    completed: 'ಆಗಿದೆ',
    incomplete: 'ಬಾಕಿ ಇದೆ',
    editDetails: 'ಬೆಳೆ ವಿವರಗಳನ್ನು ತಿದ್ದಿ',
    cropNameLabel: 'ಬೆಳೆಯ ಹೆಸರು',
    varietyLabel: 'ತಳಿ (ಐಚ್ಛಿಕ)',
    sowingDateLabel: 'ಬಿತ್ತನೆ / ನಾಟಿ ದಿನಾಂಕ',
    farmingMethodLabel: 'ಕೃಷಿ ವಿಧಾನ',
    growingRegionLabel: 'ಪ್ರದೇಶ / ಜಿಲ್ಲೆ',
    currentStageLabel: 'ಪ್ರಸ್ತುತ ಹಂತ',
    saveChanges: 'ಉಳಿಸಿ ಮತ್ತು ಅಪ್‌ಡೇಟ್ ಮಾಡಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    estimatedDatesNotice: 'ದಿನಾಂಕಗಳು ಅಂದಾಜು ಆಧಾರಿತವಾಗಿವೆ. ಸ್ಥಳೀಯ ಉಷ್ಣಾಂಶ ಮತ್ತು ಮಳೆಯು ನಿಜವಾದ ಬೆಳವಣಿಗೆಯ ದಿನಗಳನ್ನು ಬದಲಾಯಿಸಬಹುದು.',
    noSowingDateNotice: 'ಬಿತ್ತನೆ ದಿನಾಂಕ ನೀಡಿಲ್ಲ. ಕ್ಯಾಲೆಂಡರ್ ದಿನಾಂಕಗಳನ್ನು ಪಡೆಯಲು ಬಿತ್ತನೆ ದಿನಾಂಕ ನಮೂದಿಸಿ.',
    safetyWarningTitle: 'ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆಯ ಎಚ್ಚರಿಕೆ',
    safetyWarningBody: 'ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಯು ಕೇವಲ ಮಾರ್ಗದರ್ಶನವಾಗಿದೆ. ಸಿಂಪಡಿಸುವ ಮುನ್ನ ಹೊಲದ ಗಾಳಿಯ ವೇಗ ಮತ್ತು ಲೇಬಲ್ ಸೂಚನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
    remindMe: 'ಜ್ಞಾಪನೆ ನೀಡಿ',
    reminderSet: 'ಜ್ಞಾಪನೆ ಉಳಿಸಲಾಗಿದೆ',
    listenAction: 'ಧ್ವನಿ ಆಲಿಸಿ',
    daysAfterSowing: 'ಬಿತ್ತನೆಯ ನಂತರದ ದಿನಗಳು (DAS)',
    estimatedProgress: 'ಅಂದಾಜು ಪ್ರಗತಿ',
    whyItMatters: '💡 ವೈಜ್ಞಾನಿಕ ಕಾರಣ (Reasoning):',
    weatherAdjustment: '🌦️ ಹವಾಮಾನ ಹೊಂದಾಣಿಕೆ:',
    categories: {
      irrigation: '💧 ನೀರಾವರಿ',
      nutrient: '🌱 ಪೋಷಕಾಂಶ ಮತ್ತು ಗೊಬ್ಬರ',
      weed: '🌿 ಕಳೆ ನಿರ್ವಹಣೆ',
      pest_disease: '🛡️ ಕೀಟ ಮತ್ತು ರೋಗ ರಕ್ಷಣೆ',
      field_inspection: '🔍 ತಪಾಸಣೆ',
      harvest: '🌾 ಕಟಾವು'
    }
  },
  hi: {
    title: 'फसल समयरेखा (Crop Timeline)',
    subtitle: 'चरण-दर-चरण कृषि कार्य, मौसम अनुकूल सलाह एवं अनुशंसित कदम',
    completedStages: 'पूर्ण हो चुके चरण',
    currentStage: 'वर्तमान सक्रिय चरण',
    upcomingStages: 'आगामी चरण',
    nextAction: 'अगली अनुशंसित कार्यवाही',
    markCompleted: 'पूर्ण चिह्नित करें',
    completed: 'पूर्ण',
    incomplete: 'लंबित',
    editDetails: 'फसल विवरण बदलें',
    cropNameLabel: 'फसल का नाम',
    varietyLabel: 'किस्म (वैकल्पिक)',
    sowingDateLabel: 'बुवाई / रोपाई की तिथि',
    farmingMethodLabel: 'खेती की विधि',
    growingRegionLabel: 'क्षेत्र / जिला',
    currentStageLabel: 'वर्तमान चरण',
    saveChanges: 'सहेजें और अपडेट करें',
    cancel: 'रद्द करें',
    estimatedDatesNotice: 'कैलेंडर तिथियां अनुमानित हैं। वास्तविक तापमान और मौसम के अनुसार दिनों में अंतर हो सकता है।',
    noSowingDateNotice: 'बुवाई की तारीख दर्ज नहीं है। अनुमानित तिथियों के लिए बुवाई की तारीख डालें।',
    safetyWarningTitle: 'कीटनाशक छिड़काव सुरक्षा सूचना',
    safetyWarningBody: 'मौसम डेटा केवल सहायता के लिए है, सुरक्षित छिड़काव की गारंटी नहीं। खेत की वास्तविक हवा और उत्पाद लेबल अवश्य जांचें।',
    remindMe: 'रिमाइंडर सेट करें',
    reminderSet: 'रिमाइंडर सहेजा गया',
    listenAction: 'सलाह सुनें',
    daysAfterSowing: 'बुवाई के बाद के दिन (DAS)',
    estimatedProgress: 'अनुमानित प्रगति',
    whyItMatters: '💡 यह क्यों आवश्यक है (वैज्ञानिक कारण):',
    weatherAdjustment: '🌦️ मौसम अनुसार बदलाव:',
    categories: {
      irrigation: '💧 सिंचाई प्रबंधन',
      nutrient: '🌱 पोषण एवं उर्वरक',
      weed: '🌿 निराई-गुड़ाई',
      pest_disease: '🛡️ कीट एवं रोग सुरक्षा',
      field_inspection: '🔍 खेत निरीक्षण',
      harvest: '🌾 कटाई एवं गहाई'
    }
  },
  pa: {
    title: 'ਫ਼ਸਲ ਸਮਾਂ-ਰੇਖਾ (Crop Timeline)',
    subtitle: 'ਪੜਾਅ-ਦਰ-ਪੜਾਅ ਖੇਤੀ ਮੀਲ ਪੱਥਰ ਅਤੇ ਮੌਸਮ ਅਧਾਰਿਤ ਕੰਮ',
    completedStages: 'ਪੂਰੇ ਹੋ ਚੁੱਕੇ ਪੜਾਅ',
    currentStage: 'ਮੌਜੂਦਾ ਚੱਲ ਰਿਹਾ ਪੜਾਅ',
    upcomingStages: 'ਆਉਣ ਵਾਲੇ ਪੜਾਅ',
    nextAction: 'ਅਗਲਾ ਜ਼ਰੂਰੀ ਕਦਮ',
    markCompleted: 'ਮੁਕੰਮਲ ਵਜੋਂ ਚੁਣੋ',
    completed: 'ਮੁਕੰਮਲ',
    incomplete: 'ਬਾਕੀ',
    editDetails: 'ਵੇਰਵੇ ਸੋਧੋ',
    cropNameLabel: 'ਫ਼ਸਲ ਦਾ ਨਾਂ',
    varietyLabel: 'ਕਿਸਮ (ਵਿਕਲਪਿਕ)',
    sowingDateLabel: 'ਬਿਜਾਈ ਦੀ ਮਿਤੀ',
    farmingMethodLabel: 'ਖੇਤੀ ਦਾ ਤਰੀਕਾ',
    growingRegionLabel: 'ਜ਼ਿਲ੍ਹਾ / ਇਲਾਕਾ',
    currentStageLabel: 'ਮੌਜੂਦਾ ਪੜਾਅ',
    saveChanges: 'ਅੱਪਡੇਟ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    estimatedDatesNotice: 'ਤਾਰੀਖਾਂ ਅੰਦਾਜ਼ਨ ਹਨ। ਤਾਪਮਾਨ ਅਤੇ ਮੌਸਮ ਮੁਤਾਬਕ ਦਿਨ ਬਦਲ ਸਕਦੇ ਹਨ।',
    noSowingDateNotice: 'ਬਿਜਾਈ ਦੀ ਤਾਰੀਖ ਨਹੀਂ ਦਿੱਤੀ। ਕਿਰਪਾ ਕਰਕੇ ਬਿਜਾਈ ਦੀ ਤਾਰੀਖ ਦਾਖਲ ਕਰੋ।',
    safetyWarningTitle: 'ਸਪਰੇਅ ਸੁਰੱਖਿਆ ਚੇਤਾਵਨੀ',
    safetyWarningBody: 'ਮੌਸਮ ਜਾਣਕਾਰੀ ਸਿਰਫ਼ ਮਦਦ ਲਈ ਹੈ। ਸਪਰੇਅ ਤੋਂ ਪਹਿਲਾਂ ਹਵਾ ਦੀ ਰਫ਼ਤਾਰ ਅਤੇ ਲੇਬਲ ਜ਼ਰੂਰ ਵੇਖੋ।',
    remindMe: 'ਯਾਦ-ਦਹਾਨੀ ਲਗਾਓ',
    reminderSet: 'ਯਾਦ-ਦਹਾਨੀ ਸੁਰੱਖਿਅਤ',
    listenAction: 'ਸੁਣੋ',
    daysAfterSowing: 'ਬਿਜਾਈ ਤੋਂ ਬਾਅਦ ਦਿਨ (DAS)',
    estimatedProgress: 'ਅੰਦਾਜ਼ਨ ਪ੍ਰਗਤੀ',
    whyItMatters: '💡 ਜ਼ਰੂਰੀ ਕਾਰਨ:',
    weatherAdjustment: '🌦️ ਮੌਸਮ ਅਨੁਕੂਲ ਸਲਾਹ:',
    categories: {
      irrigation: '💧 ਸਿੰਚਾਈ',
      nutrient: '🌱 ਖਾਦ ਪ੍ਰਬੰਧਨ',
      weed: '🌿 ਗੋਡੀ ਅਤੇ ਨਦੀਨ',
      pest_disease: '🛡️ ਕੀੜੇ-ਮਕੌੜੇ ਸੁਰੱਖਿਆ',
      field_inspection: '🔍 ਖੇਤ ਮੁਆਇਨਾ',
      harvest: '🌾 ਵਾਢੀ'
    }
  },
  mr: {
    title: 'पीक वेळापत्रक (Crop Timeline)',
    subtitle: 'टप्प्याटप्प्याने शेतीची कामे आणि हवामानाधारित सल्ला',
    completedStages: 'पूर्ण झालेले टप्पे',
    currentStage: 'सध्याचा सक्रिय टप्पा',
    upcomingStages: 'पुढील टप्पे',
    nextAction: 'पुढील शिफारस केलेली कृती',
    markCompleted: 'पूर्ण झाले',
    completed: 'पूर्ण',
    incomplete: 'प्रलंबित',
    editDetails: 'तपशील बदला',
    cropNameLabel: 'पिकाचे नाव',
    varietyLabel: 'वाण / जात',
    sowingDateLabel: 'पेरणीची तारीख',
    farmingMethodLabel: 'शेती पद्धत',
    growingRegionLabel: 'परिसर / जिल्हा',
    currentStageLabel: 'सध्याचा टप्पा',
    saveChanges: 'जतन करा',
    cancel: 'रद्द करा',
    estimatedDatesNotice: 'तारखा अंदाजित आहेत. स्थानिक हवामानानुसार दिवस बदलू शकतात.',
    noSowingDateNotice: 'पेरणीची तारीख नोंदवलेली नाही. अचूक तारखांसाठी तारीख भरा.',
    safetyWarningTitle: 'फवारणी सुरक्षा सूचना',
    safetyWarningBody: 'हवामान अंदाज केवळ मदतीसाठी आहे. फवारणीपूर्वी प्रत्यक्ष वाऱ्याचा वेग आणि औषधाचे लेबल तपासा.',
    remindMe: 'स्मरणपत्र लावा',
    reminderSet: 'स्मरणपत्र जतन केले',
    listenAction: 'सल्ला ऐका',
    daysAfterSowing: 'पेरणीनंतरचे दिवस (DAS)',
    estimatedProgress: 'अंदाजित प्रगती',
    whyItMatters: '💡 वैज्ञानिक कारण:',
    weatherAdjustment: '🌦️ हवामानानुसार बदल:',
    categories: {
      irrigation: '💧 पाणी व्यवस्थापन',
      nutrient: '🌱 खत व्यवस्थापन',
      weed: '🌿 खुरपणी व तण नियंत्रण',
      pest_disease: '🛡️ कीड व रोग नियंत्रण',
      field_inspection: '🔍 शेत पाहणी',
      harvest: '🌾 काढणी'
    }
  },
  te: {
    title: 'పంట కాలపట్టిక (Crop Timeline)',
    subtitle: 'దశలవారీగా వ్యవసాయ పనులు మరియు వాతావరణ ఆధారిత సిఫార్సులు',
    completedStages: 'పూర్తయిన దశలు',
    currentStage: 'ప్రస్తుత దశ',
    upcomingStages: 'రాబోయే దశలు',
    nextAction: 'తదుపరి సిఫార్సు చేయబడిన చర్య',
    markCompleted: 'పూర్తయినట్లు గుర్తించండి',
    completed: 'పూర్తయింది',
    incomplete: 'పెండింగ్',
    editDetails: 'వివరాలు సవరించండి',
    cropNameLabel: 'పంట పేరు',
    varietyLabel: 'రకం',
    sowingDateLabel: 'విత్తిన తేదీ',
    farmingMethodLabel: 'వ్యవసాయ పద్ధతి',
    growingRegionLabel: 'ప్రాంతం / జిల్లా',
    currentStageLabel: 'ప్రస్తుత దశ',
    saveChanges: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    estimatedDatesNotice: 'తేదీలు అంచనా మాత్రమే. ఉష్ణోగ్రత మరియు వాతావరణం బట్టి మారవచ్చు.',
    noSowingDateNotice: 'విత్తిన తేదీ నమోదు కాలేదు. తేదీలను చూడటానికి విత్తిన తేదీ ఇవ్వండి.',
    safetyWarningTitle: 'పిచికారీ భద్రతా హెచ్చరిక',
    safetyWarningBody: 'వాతావరణ వివరాలు సమాచారం కొరకు మాత్రమే. పిచికారీకి ముందు గాలి వేగాన్ని గమనించండి.',
    remindMe: 'గుర్తుంచుకోండి',
    reminderSet: 'రిమైండర్ సేవ్ అయింది',
    listenAction: 'వాయిస్ వినండి',
    daysAfterSowing: 'విత్తిన తర్వాత రోజులు (DAS)',
    estimatedProgress: 'అంచనా పురోగతి',
    whyItMatters: '💡 శాస్త్రీయ కారణం:',
    weatherAdjustment: '🌦️ వాతావరణ మార్పులు:',
    categories: {
      irrigation: '💧 నీటి యాజమాన్యం',
      nutrient: '🌱 ఎరువుల యాజమాన్యం',
      weed: '🌿 కలుపు నివారణ',
      pest_disease: '🛡️ పురుగులు & తెగుళ్ల నివారణ',
      field_inspection: '🔍 క్షేత్ర పరిశీలన',
      harvest: '🌾 కోత'
    }
  },
  ta: {
    title: 'பயிர் கால அட்டவணை (Crop Timeline)',
    subtitle: 'படிபடியான விவசாய நிலைகள் மற்றும் வானிலை சார்ந்த வழிகாட்டல்',
    completedStages: 'முடிவடைந்த நிலைகள்',
    currentStage: 'தற்போதைய நிலை',
    upcomingStages: 'வரவிருக்கும் நிலைகள்',
    nextAction: 'அடுத்த பரிந்துரைக்கப்பட்ட செயல்',
    markCompleted: 'முடிந்தது என குறிக்கவும்',
    completed: 'முடிந்தது',
    incomplete: 'நிலுவை',
    editDetails: 'விவரங்களை மாற்றவும்',
    cropNameLabel: 'பயிர் பெயர்',
    varietyLabel: 'ரகம்',
    sowingDateLabel: 'விதைத்த / நட்ட தேதி',
    farmingMethodLabel: 'விவசாய முறை',
    growingRegionLabel: 'பகுதி / மாவட்டம்',
    currentStageLabel: 'தற்போதைய நிலை',
    saveChanges: 'சேமித்து புதுப்பிக்கவும்',
    cancel: 'ரத்து செய்',
    estimatedDatesNotice: 'தேதிகள் தோராயமானவை. உள்ளூர் வெப்பநிலைக்கு ஏற்ப நாட்கள் மாறுபடலாம்.',
    noSowingDateNotice: 'விதைப்பு தேதி குறிப்பிடப்படவில்லை. துல்லியமான தேதிகளுக்கு விதைத்த தேதியை உள்ளிடவும்.',
    safetyWarningTitle: 'மருந்து தெளிப்பு பாதுகாப்பு அறிவிப்பு',
    safetyWarningBody: 'வானிலை தகவல் வழிகாட்டல் மட்டுமே. தெளிப்பதற்கு முன் காற்றின் வேகத்தை கவனிக்கவும்.',
    remindMe: 'நினைவூட்டல் அமை',
    reminderSet: 'நினைவூட்டல் சேமிக்கப்பட்டது',
    listenAction: 'கேட்கவும்',
    daysAfterSowing: 'விதைத்த பின் நாட்கள் (DAS)',
    estimatedProgress: 'தோராயமான முன்னேற்றம்',
    whyItMatters: '💡 காரணம்:',
    weatherAdjustment: '🌦️ வானிலை மாற்றங்கள்:',
    categories: {
      irrigation: '💧 பாசன மேலாண்மை',
      nutrient: '🌱 ஊட்டச்சத்து & உரம்',
      weed: '🌿 களையெடுப்பு',
      pest_disease: '🛡️ பூச்சி & நோய் மேலாண்மை',
      field_inspection: '🔍 வயல் ஆய்வு',
      harvest: '🌾 அறுவடை'
    }
  },
  gu: {
    title: 'પાક સમયરેખા (Crop Timeline)',
    subtitle: 'તબક્કાવાર ખેતીના કાર્યો અને હવામાન આધારિત સલાહ',
    completedStages: 'પૂર્ણ થયેલ તબક્કા',
    currentStage: 'હાલનો સક્રિય તબક્કો',
    upcomingStages: 'આગામી તબક્કા',
    nextAction: 'આગલું ભલામણ કરેલ કાર્ય',
    markCompleted: 'પૂર્ણ તરીકે ચિહ્નિત કરો',
    completed: 'પૂર્ણ',
    incomplete: 'બાકી',
    editDetails: 'વિગતો સુધારો',
    cropNameLabel: 'પાકનું નામ',
    varietyLabel: 'જાત (વૈકલ્પિક)',
    sowingDateLabel: 'વાવણીની તારીખ',
    farmingMethodLabel: 'ખેતી પદ્ધતિ',
    growingRegionLabel: 'વિસ્તાર / જિલ્લો',
    currentStageLabel: 'હાલનો તબક્કો',
    saveChanges: 'સાચવો અને અપડેટ કરો',
    cancel: 'રદ કરો',
    estimatedDatesNotice: 'તારીખો અંદાજિત છે. સ્થાનિક તાપમાન અને હવામાન મુજબ ફેરફાર થઈ શકે છે.',
    noSowingDateNotice: 'વાવણી તારીખ દાખલ નથી. અંદાજિત તારીખો માટે વાવણી તારીખ દાખલ કરો.',
    safetyWarningTitle: 'છંટકાવ સલામતી ચેતવણી',
    safetyWarningBody: 'હવામાન માત્ર માર્ગદર્શન માટે છે. છંટકાવ પહેલાં પવનની ગતિ અને લેબલ સૂચનાઓ તપાસો.',
    remindMe: 'રીમાઇન્ડર સેટ કરો',
    reminderSet: 'રીમાઇન્ડર સાચવ્યું',
    listenAction: 'સાંભળો',
    daysAfterSowing: 'વાવણી પછીના દિવસો (DAS)',
    estimatedProgress: 'અંદાજિત પ્રગતિ',
    whyItMatters: '💡 વૈજ્ઞાનિક કારણ:',
    weatherAdjustment: '🌦️ હવામાન મુજબ ફેરફાર:',
    categories: {
      irrigation: '💧 પિયત વ્યવસ્થાપન',
      nutrient: '🌱 ખાતર વ્યવસ્થાપન',
      weed: '🌿 નીંદણ નિયંત્રણ',
      pest_disease: '🛡️ જીવાત અને રોગ રક્ષણ',
      field_inspection: '🔍 ખેતર નિરીક્ષણ',
      harvest: '🌾 લણણી'
    }
  },
  bn: {
    title: 'ফসল সময়রেখা (Crop Timeline)',
    subtitle: 'পর্যায়ক্রমিক কৃষি কার্যক্রম ও আবহাওয়া ভিত্তিক নির্দেশিকা',
    completedStages: 'সম্পূর্ণ পর্যায়',
    currentStage: 'বর্তমান সক্রিয় পর্যায়',
    upcomingStages: 'আসন্ন পর্যায়',
    nextAction: 'পরবর্তী প্রস্তাবিত পদক্ষেপ',
    markCompleted: 'সম্পন্ন চিহ্নিত করুন',
    completed: 'সম্পন্ন',
    incomplete: 'বাকি',
    editDetails: 'ফসলের বিবরণ পরিবর্তন',
    cropNameLabel: 'ফসলের নাম',
    varietyLabel: 'জাত (ঐচ্ছিক)',
    sowingDateLabel: 'বপন / রোপণের তারিখ',
    farmingMethodLabel: 'চাষ পদ্ধতি',
    growingRegionLabel: 'অঞ্চল / জেলা',
    currentStageLabel: 'বর্তমান পর্যায়',
    saveChanges: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    estimatedDatesNotice: 'ক্যালেন্ডার তারিখগুলি আনুমানিক। স্থানীয় আবহাওয়ার উপর ভিত্তি করে দিন পরিবর্তিত হতে পারে।',
    noSowingDateNotice: 'বপনের তারিখ দেওয়া নেই। সঠিক তারিখের জন্য বপনের তারিখ লিখুন।',
    safetyWarningTitle: 'কীটনাশক স্প্রে সতর্কতা',
    safetyWarningBody: 'আবহাওয়া কেবল সহায়ক নির্দেশিকা। স্প্রে করার পূর্বে বাতাসের গতি ও লেবেল পরীক্ষা করুন।',
    remindMe: 'রিমাইন্ডার সেট করুন',
    reminderSet: 'রিমাইন্ডার সংরক্ষিত',
    listenAction: 'শুনুন',
    daysAfterSowing: 'বপনের পরের দিন (DAS)',
    estimatedProgress: 'আনুমানিক অগ্রগতি',
    whyItMatters: '💡 বৈজ্ঞানিক কারণ:',
    weatherAdjustment: '🌦️ আবহাওয়া ভিত্তিক সমন্বয়:',
    categories: {
      irrigation: '💧 সেচ ব্যবস্থাপনা',
      nutrient: '🌱 সার ব্যবস্থাপনা',
      weed: '🌿 আগাছা দমন',
      pest_disease: '🛡️ বালাই ও রোগ প্রতিরোধ',
      field_inspection: '🔍 মাঠ পরিদর্শন',
      harvest: '🌾 ফসল তোলা'
    }
  }
};
