import { SupportedLanguage } from '../types';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  subTagline: string;
  tabs: {
    home: string;
    myFarm: string;
    soilScan: string;
    marketplace: string;
    profileSettings: string;
    browseCrops: string;
    myEnquiries: string;
  };
  auth: {
    signInTab: string;
    createAccountTab: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    chooseRole: string;
    farmerRole: string;
    farmerRoleDesc: string;
    buyerRole: string;
    buyerRoleDesc: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    districtLabel: string;
    districtPlaceholder: string;
    farmAreaLabel: string;
    businessNameLabel: string;
    businessNamePlaceholder: string;
    businessTypeLabel: string;
    signInBtn: string;
    registerBtn: string;
    forgotPasswordLink: string;
    forgotPasswordTitle: string;
    forgotPasswordDesc: string;
    sendResetCodeBtn: string;
    resetCodeLabel: string;
    newPasswordLabel: string;
    confirmNewPasswordLabel: string;
    resetPasswordBtn: string;
    backToSignIn: string;
    quickTestFarmerBtn: string;
    quickTestBuyerBtn: string;
    testNotice: string;
    errorPassMismatch: string;
    errorPassLength: string;
    errorInvalidEmail: string;
    errorNameRequired: string;
    successRegistered: string;
    successLoggedIn: string;
    successPassReset: string;
  };
  buyer: {
    welcome: string;
    subheading: string;
    availableLots: string;
    myEnquiries: string;
    awaitingReply: string;
    quickSearchPlaceholder: string;
    browseCropsTitle: string;
    browseCropsSubtitle: string;
    allCategories: string;
    allMandiSources: string;
    verifiedGrowersOnly: string;
    demoLotsOnly: string;
    sendEnquiry: string;
    enquiryModalTitle: string;
    enquiryModalSubtitle: string;
    buyerNameLabel: string;
    buyerPhoneLabel: string;
    buyerBusinessLabel: string;
    requestedQtyLabel: string;
    offeredPriceLabel: string;
    messageLabel: string;
    submitEnquiryBtn: string;
    cancelBtn: string;
    enquirySuccess: string;
    myEnquiriesTitle: string;
    myEnquiriesSubtitle: string;
    filterAll: string;
    filterPending: string;
    filterContacted: string;
    filterAccepted: string;
    noEnquiriesTitle: string;
    noEnquiriesDesc: string;
    directGrowerContact: string;
    mandiPriceTrendsTitle: string;
  };
  home: {
    welcomeGreeting: string;
    taglineHeading: string;
    overviewTitle: string;
    activeCrops: string;
    totalLand: string;
    soilHealth: string;
    cropHealth: string;
    notAssessedYet: string;
    scanAssessmentTitle?: string;
    quickActions: string;
    soilScanAction: string;
    soilScanDesc: string;
    aiAdvisorAction: string;
    aiAdvisorDesc: string;
    cropDoctorAction?: string;
    cropDoctorDesc?: string;
    fertilizerAction: string;
    fertilizerDesc: string;
    marketplaceAction: string;
    marketplaceDesc: string;
    weatherTitle: string;
    weatherUnavailable: string;
    weatherNotice: string;
    recentActivity: string;
  };
  myFarm: {
    title: string;
    subtitle: string;
    editFarm: string;
    addCrop: string;
    addObservation: string;
    activeCropsTab: string;
    observationsTab: string;
    soilTestsTab: string;
    emptyCropsTitle: string;
    emptyCropsDesc: string;
    growthStage: string;
    sowingDate: string;
    harvestEst: string;
    diagnoseProblem: string;
    fertilizerGuidance: string;
  };
  soilScan: {
    title: string;
    tagline: string;
    scientificDisclaimer: string;
    photoStep: string;
    photoInstruction: string;
    contextStep: string;
    labStep: string;
    submitScan: string;
    resultsSummary: string;
    statusUnavailableAI: string;
  };
  cropDoctor: {
    title: string;
    subtitle: string;
    notice: string;
    selectCrop: string;
    selectStage: string;
    describeIssue: string;
    photoOptional: string;
    submitProblem: string;
  };
  fertilizer: {
    title: string;
    subtitle: string;
    notice: string;
    selectCrop: string;
    selectStage: string;
    soilTestStatus: string;
    calculateGuidance: string;
  };
  marketplace: {
    title: string;
    subtitle: string;
    demoNotice: string;
    searchPlaceholder: string;
    allCategories: string;
    listProduceBtn: string;
    sampleDataBadge: string;
    contactSeller: string;
  };
  profile: {
    title: string;
    farmerDetails: string;
    buyerDetails: string;
    businessName: string;
    businessType: string;
    mandiLocation: string;
    activeRole: string;
    farmerAccount: string;
    buyerAccount: string;
    switchRoleBtn: string;
    accountSecurity: string;
    changePasswordTitle: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    confirmNewPasswordLabel: string;
    savePasswordBtn: string;
    signOutBtn: string;
    deleteAccountBtn: string;
    language: string;
    units: string;
    storageInfo: string;
    resetDemoData: string;
    exportBackup: string;
    importBackup: string;
    loggedInAs: string;
  };
}

export const LANGUAGES: { code: SupportedLanguage; label: string; localLabel: string }[] = [
  { code: 'en', label: 'English', localLabel: 'English' },
  { code: 'hi', label: 'Hindi', localLabel: 'हिंदी' },
  { code: 'pa', label: 'Punjabi', localLabel: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: 'Marathi', localLabel: 'मराठी' },
  { code: 'te', label: 'Telugu', localLabel: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', localLabel: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', localLabel: 'ಕನ್ನಡ' },
  { code: 'gu', label: 'Gujarati', localLabel: 'ગુજરાતી' },
  { code: 'bn', label: 'Bengali', localLabel: 'বাংলা' },
];

const createLangDict = (overrides: any): TranslationDictionary => ({
  ...TRANSLATIONS_EN,
  ...overrides,
  tabs: { ...TRANSLATIONS_EN.tabs, ...(overrides.tabs || {}) },
  auth: { ...TRANSLATIONS_EN.auth, ...(overrides.auth || {}) },
  buyer: { ...TRANSLATIONS_EN.buyer, ...(overrides.buyer || {}) },
  home: { ...TRANSLATIONS_EN.home, ...(overrides.home || {}) },
  myFarm: { ...TRANSLATIONS_EN.myFarm, ...(overrides.myFarm || {}) },
  soilScan: { ...TRANSLATIONS_EN.soilScan, ...(overrides.soilScan || {}) },
  cropDoctor: { ...TRANSLATIONS_EN.cropDoctor, ...(overrides.cropDoctor || {}) },
  fertilizer: { ...TRANSLATIONS_EN.fertilizer, ...(overrides.fertilizer || {}) },
  marketplace: { ...TRANSLATIONS_EN.marketplace, ...(overrides.marketplace || {}) },
  profile: { ...TRANSLATIONS_EN.profile, ...(overrides.profile || {}) },
});

export const TRANSLATIONS_EN: TranslationDictionary = {
  appName: 'AgriConnect',
  tagline: 'Scan. Understand. Grow. Earn.',
  subTagline: 'Smart Farming. Fair Earnings.',
    tabs: {
      home: 'Home',
      myFarm: 'My Farm',
      soilScan: 'Scan',
      marketplace: 'Marketplace',
      profileSettings: 'Profile & Settings',
      browseCrops: 'Browse Crops',
      myEnquiries: 'My Enquiries',
    },
    home: {
      welcomeGreeting: 'Welcome back,',
      taglineHeading: 'Your Farm, Smarter.',
      overviewTitle: 'Farm Overview',
      activeCrops: 'Active Crops',
      totalLand: 'Total Land',
      soilHealth: 'Soil Records',
      cropHealth: 'Crop Health',
      notAssessedYet: 'Not assessed yet',
      scanAssessmentTitle: 'Scan Assessment',
      quickActions: 'Farm Tools',
      soilScanAction: 'Scan',
      soilScanDesc: 'Plant leaf check, soil texture & AI agronomy advisor',
      aiAdvisorAction: 'AI Advisor',
      aiAdvisorDesc: 'Certified agronomic advice powered by Gemini AI',
      cropDoctorAction: 'Crop Doctor',
      cropDoctorDesc: 'Record plant symptoms and inspect crop health checklist',
      fertilizerAction: 'Fertilizer Guidance',
      fertilizerDesc: 'Nutrient requirements tailored for your growth stage',
      marketplaceAction: 'Marketplace',
      marketplaceDesc: 'Explore buyer requirements & list your farm produce',
      weatherTitle: 'Weather & Farming Conditions',
      weatherUnavailable: 'Live Weather Service Not Connected',
      weatherNotice: 'Stage 1 operates on a ₹0 budget. Real-time satellite weather will integrate in an upcoming release.',
      recentActivity: 'Recent Farm Activity',
    },
    myFarm: {
      title: 'My Farm',
      subtitle: 'Field records, crop growth timelines & observations',
      editFarm: 'Edit Farm Info',
      addCrop: 'Add New Crop',
      addObservation: 'Record Observation',
      activeCropsTab: 'Active Crops',
      observationsTab: 'Field Observations',
      soilTestsTab: 'Saved Soil Tests',
      emptyCropsTitle: 'No crops registered yet',
      emptyCropsDesc: 'Add your active crop plots to track growth stages and sowing timelines.',
      growthStage: 'Growth Stage',
      sowingDate: 'Sowing Date',
      harvestEst: 'Expected Harvest',
      diagnoseProblem: 'Check Symptoms',
      fertilizerGuidance: 'Fertilizer Needs',
    },
    soilScan: {
      title: 'Soil Scan',
      tagline: 'Understand your soil foundation with science-grounded records',
      scientificDisclaimer: 'Scientific Notice: A photograph alone cannot measure exact pH, Nitrogen, Phosphorus or Potassium. Visual inspection detects surface texture and moisture; verified chemical levels require lab test values.',
      photoStep: '1. Soil Photograph',
      photoInstruction: 'Select or take a clear photo of your topsoil (5–10 cm depth).',
      contextStep: '2. Field & Soil Context',
      labStep: '3. Laboratory / Soil Health Card (Optional)',
      submitScan: 'Analyze & Record Soil Data',
      resultsSummary: 'Soil Profile Summary',
      statusUnavailableAI: 'Stage 1 Notice: Automated AI photo diagnosis is not connected yet. This report organizes your inputs and scientific observations.',
    },
    cropDoctor: {
      title: 'Crop Doctor',
      subtitle: 'Identify symptoms & inspect extension diagnostic checklist',
      notice: 'Automated AI crop diagnosis is not connected yet (Stage 1 ₹0 Budget). Review the agronomic checklist and consult local Krishi Vigyan Kendra for prescription chemical use.',
      selectCrop: 'Select Crop',
      selectStage: 'Growth Stage',
      describeIssue: 'Describe observed symptoms',
      photoOptional: 'Plant photograph (Optional)',
      submitProblem: 'Record Symptoms & View Checklist',
    },
    fertilizer: {
      title: 'Fertilizer Guidance',
      subtitle: 'Nutrient demand principles & growth stage timing',
      notice: 'Nutrient recommendations require verified soil tests and local extension officer approval. Always avoid unmeasured chemical applications.',
      selectCrop: 'Target Crop',
      selectStage: 'Current Stage',
      soilTestStatus: 'Soil Test Status',
      calculateGuidance: 'View Nutrient Guidelines',
    },
    marketplace: {
      title: 'Marketplace',
      subtitle: 'Connect farmers, FPOs, and bulk agricultural buyers',
      demoNotice: 'DEMONSTRATION MARKETPLACE — Stage 1 Preview. Real transactions and live mandi prices will connect in the next phase.',
      searchPlaceholder: 'Search crops, varieties, or locations...',
      allCategories: 'All Produce',
      listProduceBtn: 'List Your Produce',
      sampleDataBadge: 'DEMONSTRATION DATA',
      contactSeller: 'Contact Seller / Buyer',
    },
    auth: {
      signInTab: 'Sign In',
      createAccountTab: 'Create Account',
      welcomeTitle: 'Welcome to AgriConnect',
      welcomeSubtitle: 'Smart Farming. Direct Sourcing. Fair Earnings.',
      chooseRole: 'Select your account type',
      farmerRole: 'I am a Farmer / Grower',
      farmerRoleDesc: 'Soil scanning, crop records, weather tools & direct produce selling.',
      buyerRole: 'I am a Buyer / Trader',
      buyerRoleDesc: 'Procure wholesale grains, pulses, and vegetables directly from farmers.',
      fullNameLabel: 'Full Display Name',
      fullNamePlaceholder: 'e.g. Ananya Patil',
      emailLabel: 'Email Address',
      emailPlaceholder: 'agriconnect.farmer.test@example.com',
      passwordLabel: 'Password',
      confirmPasswordLabel: 'Confirm Password',
      districtLabel: 'Village / District',
      districtPlaceholder: 'Vijayapura',
      farmAreaLabel: 'Total Farm Area (Acres)',
      businessNameLabel: 'Business / Company Name',
      businessNamePlaceholder: 'Vijayapura Commodity Traders',
      businessTypeLabel: 'Business Category',
      signInBtn: 'Sign In to AgriConnect',
      registerBtn: 'Create Account & Continue',
      forgotPasswordLink: 'Forgot password?',
      forgotPasswordTitle: 'Reset Your Password',
      forgotPasswordDesc: 'Enter your account email to generate a secure recovery code.',
      sendResetCodeBtn: 'Generate Recovery Code',
      resetCodeLabel: 'Recovery Code',
      newPasswordLabel: 'New Password',
      confirmNewPasswordLabel: 'Confirm New Password',
      resetPasswordBtn: 'Update Password & Sign In',
      backToSignIn: 'Back to Sign In',
      quickTestFarmerBtn: 'Fill Farmer Test Details (Ananya Patil)',
      quickTestBuyerBtn: 'Fill Buyer Test Details',
      testNotice: 'Test Details: Choose your own secure password (minimum 6 characters).',
      errorPassMismatch: 'Passwords do not match.',
      errorPassLength: 'Password must be at least 6 characters.',
      errorInvalidEmail: 'Please enter a valid email address.',
      errorNameRequired: 'Please enter your display name.',
      successRegistered: 'Account created successfully! Welcome to AgriConnect.',
      successLoggedIn: 'Signed in successfully!',
      successPassReset: 'Password reset successfully. You can now sign in.',
    },
    buyer: {
      welcome: 'Welcome',
      subheading: 'Direct grower sourcing platform connecting you with regional farmers & mandis',
      availableLots: 'Available Lots',
      myEnquiries: 'My Enquiries',
      awaitingReply: 'Awaiting Reply',
      quickSearchPlaceholder: 'Search crops, varieties, or locations...',
      browseCropsTitle: 'Browse Crop Produce',
      browseCropsSubtitle: 'Verified farmer harvests and direct procurement listings',
      allCategories: 'All Categories',
      allMandiSources: 'All Mandi Sources',
      verifiedGrowersOnly: 'Farmer Lots Only',
      demoLotsOnly: 'Sample Lots (Demo)',
      sendEnquiry: 'Send Purchase Enquiry',
      enquiryModalTitle: 'Submit Procurement Enquiry',
      enquiryModalSubtitle: 'Direct enquiry to verified grower for quantity, price, and samples',
      buyerNameLabel: 'Your Name',
      buyerPhoneLabel: 'Contact Phone Number',
      buyerBusinessLabel: 'Firm / Mandi Trader Name',
      requestedQtyLabel: 'Required Quantity (Quintal)',
      offeredPriceLabel: 'Offered Price (₹ / Quintal)',
      messageLabel: 'Enquiry Message / Notes',
      submitEnquiryBtn: 'Send Purchase Enquiry',
      cancelBtn: 'Cancel',
      enquirySuccess: 'Your enquiry has been submitted directly to the farmer!',
      myEnquiriesTitle: 'My Purchase Enquiries',
      myEnquiriesSubtitle: 'Track submitted quotes, farmer responses, and procurement negotiations',
      filterAll: 'All',
      filterPending: 'Pending Response',
      filterContacted: 'Contacted',
      filterAccepted: 'Accepted',
      noEnquiriesTitle: 'No Enquiries Found',
      noEnquiriesDesc: 'You have not submitted any purchase enquiries yet. Browse verified farmer crops to send an enquiry.',
      directGrowerContact: 'Direct Grower Contact',
      mandiPriceTrendsTitle: 'Mandi Modal Price Trends',
    },
    profile: {
      title: 'Profile & Settings',
      farmerDetails: 'Farmer & Farm Details',
      buyerDetails: 'Buyer & Business Details',
      businessName: 'Business Name',
      businessType: 'Business Type',
      mandiLocation: 'Mandi / Location',
      activeRole: 'Active Account Role',
      farmerAccount: 'Farmer Account',
      buyerAccount: 'Buyer Account',
      switchRoleBtn: 'Switch Role',
      accountSecurity: 'Account Security & Password',
      changePasswordTitle: 'Change Account Password',
      currentPasswordLabel: 'Current Password',
      newPasswordLabel: 'New Password',
      confirmNewPasswordLabel: 'Confirm New Password',
      savePasswordBtn: 'Update Password',
      signOutBtn: 'Sign Out',
      deleteAccountBtn: 'Delete Account Permanently',
      language: 'App Language',
      units: 'Measurement Units',
      storageInfo: 'Data Storage & Privacy',
      resetDemoData: 'Reset Demonstration Data',
      exportBackup: 'Export Farm Data (JSON)',
      importBackup: 'Import Farm Data (JSON)',
      loggedInAs: 'Signed in as:',
    },
};

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: TRANSLATIONS_EN,
  hi: createLangDict({
    appName: 'AgriConnect',
    tagline: 'जांचें। समझें। उगाएं। कमाएं।',
    subTagline: 'स्मार्ट खेती। सही कमाई।',
    tabs: {
      home: 'होम',
      myFarm: 'मेरा खेत',
      soilScan: 'मृदा जांच',
      marketplace: 'मंडी बाजार',
      profileSettings: 'प्रोफ़ाइल व सेटिंग्स',
    },
    home: {
      welcomeGreeting: 'नमस्ते,',
      taglineHeading: 'आपकी खेती, अब स्मार्ट।',
      overviewTitle: 'खेत का विवरण',
      activeCrops: 'सक्रिय फसलें',
      totalLand: 'कुल भूमि',
      soilHealth: 'मृदा रिकॉर्ड',
      cropHealth: 'फसल स्वास्थ्य',
      notAssessedYet: 'अभी मूल्यांकन नहीं हुआ',
      quickActions: 'कृषि उपकरण',
      soilScanAction: 'स्कैन (Scan)',
      soilScanDesc: 'पत्तियों की जांच, मिट्टी की बनावट व एआई सलाह',
      aiAdvisorAction: 'एआई सलाहकार',
      aiAdvisorDesc: 'प्रमाणित कृषि विशेषज्ञ से तुरंत सलाह लें',
      cropDoctorAction: 'फसल डॉक्टर',
      cropDoctorDesc: 'फसल के लक्षण दर्ज करें और रोग निवारण चेकलिस्ट देखें',
      fertilizerAction: 'उर्वरक सलाह',
      fertilizerDesc: 'फसल की अवस्था अनुसार संतुलित खाद प्रबंधन',
      marketplaceAction: 'मंडी बाजार',
      marketplaceDesc: 'फसल की उपज बेचें और खरीदारों की मांग देखें',
      weatherTitle: 'मौसम व कृषि दशा',
      weatherUnavailable: 'लाइव मौसम सेवा अभी जुड़ी नहीं है',
      weatherNotice: 'चरण 1 ₹0 बजट पर कार्य कर रहा है। उपग्रह मौसम डेटा जल्द ही जोड़ा जाएगा।',
      recentActivity: 'हाल की कृषि गतिविधि',
    },
    myFarm: {
      title: 'मेरा खेत',
      subtitle: 'खेत रिकॉर्ड, फसल चक्र व अवलोकन',
      editFarm: 'खेत जानकारी बदलें',
      addCrop: 'नई फसल जोड़ें',
      addObservation: 'अवलोकन दर्ज करें',
      activeCropsTab: 'सक्रिय फसलें',
      observationsTab: 'खेत अवलोकन',
      soilTestsTab: 'मृदा जांच रिकॉर्ड',
      emptyCropsTitle: 'अभी कोई फसल दर्ज नहीं है',
      emptyCropsDesc: 'अपनी सक्रिय फसलों को जोड़कर विकास चक्र और बुवाई की तारीख ट्रैक करें।',
      growthStage: 'विकास अवस्था',
      sowingDate: 'बुवाई की तारीख',
      harvestEst: 'कटाई अनुमान',
      diagnoseProblem: 'लक्षण जांचें',
      fertilizerGuidance: 'खाद सलाह',
    },
    soilScan: {
      title: 'मृदा जांच',
      tagline: 'वैज्ञानिक आधार पर अपनी मिट्टी को समझें',
      scientificDisclaimer: 'वैज्ञानिक सूचना: केवल फोटो से सटीक pH, नाइट्रोजन या फॉस्फोरस का पता नहीं लग सकता। फोटो सतह की बनावट दर्शाती है; रासायनिक शुद्धता हेतु प्रयोगशाला रिपोर्ट आवश्यक है।',
      photoStep: '१. मिट्टी की तस्वीर',
      photoInstruction: 'खेत की ऊपरी मिट्टी (5-10 सेमी) की साफ तस्वीर चुनें।',
      contextStep: '२. खेत व मिट्टी का संदर्भ',
      labStep: '३. मृदा स्वास्थ्य कार्ड / लैब डेटा (वैकल्पिक)',
      submitScan: 'मिट्टी का विवरण दर्ज करें',
      resultsSummary: 'मृदा स्वास्थ्य रिपोर्ट',
      statusUnavailableAI: 'सूचना: स्वचालित AI विश्लेषण अभी जुड़ा नहीं है। यह रिपोर्ट आपके दर्ज डेटा पर आधारित है।',
    },
    cropDoctor: {
      title: 'फसल डॉक्टर',
      subtitle: 'रोग लक्षण दर्ज करें और वैज्ञानिक सलाह देखें',
      notice: 'स्वचालित AI निदान अभी सक्रिय नहीं है (चरण 1)। कीटनाशक उपयोग से पहले कृषि विज्ञान केंद्र (KVK) से सलाह लें।',
      selectCrop: 'फसल चुनें',
      selectStage: 'विकास अवस्था',
      describeIssue: 'समस्या का विवरण दें',
      photoOptional: 'पौधे की फोटो (वैकल्पिक)',
      submitProblem: 'लक्षण दर्ज करें व चेकलिस्ट देखें',
    },
    fertilizer: {
      title: 'उर्वरक सलाह',
      subtitle: 'फसल विकास अनुसार पोषक तत्वों की आवश्यकता',
      notice: 'उर्वरक उपयोग मृदा परीक्षण और कृषि अधिकारी की सिफारिश अनुसार ही करें। बिना माप के रसायन न डालें।',
      selectCrop: 'फसल',
      selectStage: 'अवस्था',
      soilTestStatus: 'मृदा परीक्षण स्थिति',
      calculateGuidance: 'पोषक तत्व मार्गदर्शिका देखें',
    },
    marketplace: {
      title: 'मंडी बाजार',
      subtitle: 'किसान और खरीदारों का सीधा संपर्क',
      demoNotice: 'प्रदर्शन मंडी डेटा (Demonstration Data) — वास्तविक सौदे और ई-नाम मंडी भाव अगले चरण में जुड़ेंगे।',
      searchPlaceholder: 'फसल, किस्म या जिला खोजें...',
      allCategories: 'सभी फसलें',
      listProduceBtn: 'अपनी उपज सूचीबद्ध करें',
      sampleDataBadge: 'प्रदर्शन डेटा (DEMO)',
      contactSeller: 'संपर्क करें',
    },
    profile: {
      title: 'प्रोफ़ाइल व सेटिंग्स',
      farmerDetails: 'किसान व खेत विवरण',
      language: 'ऐप की भाषा',
      units: 'माप की इकाइयां',
      storageInfo: 'डेटा सुरक्षा व स्टोरेज',
      resetDemoData: 'प्रदर्शन डेटा रीसेट करें',
      exportBackup: 'डेटा बैकअप डाउनलोड करें (JSON)',
      importBackup: 'डेटा रीस्टोर करें (JSON)',
    },
  }),
  pa: createLangDict({
    appName: 'AgriConnect',
    tagline: 'ਜਾਂਚੋ। ਸਮਝੋ। ਉਗਾਓ। ਕਮਾਓ।',
    subTagline: 'ਸਮਾਰਟ ਖੇਤੀ। ਚੰਗੀ ਕਮਾਈ।',
    tabs: {
      home: 'ਹੋਮ',
      myFarm: 'ਮੇਰਾ ਖੇਤ',
      soilScan: 'ਮਿੱਟੀ ਜਾਂਚ',
      marketplace: 'ਮੰਡੀ ਬਾਜ਼ਾਰ',
      profileSettings: 'ਪ੍ਰੋਫਾਈਲ ਤੇ ਸੈਟਿੰਗਜ਼',
    },
    home: {
      welcomeGreeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ,',
      taglineHeading: 'ਤੁਹਾਡੀ ਖੇਤੀ, ਸਮਾਰਟ ਖੇਤੀ।',
      overviewTitle: 'ਖੇਤ ਦਾ ਵੇਰਵਾ',
      activeCrops: 'ਚੱਲ ਰਹੀਆਂ ਫ਼ਸਲਾਂ',
      totalLand: 'ਕੁੱਲ ਜ਼ਮੀਨ',
      soilHealth: 'ਮਿੱਟੀ ਰਿਕਾਰਡ',
      cropHealth: 'ਫ਼ਸਲ ਦੀ ਸਿਹਤ',
      notAssessedYet: 'ਹਾਲੇ ਜਾਂਚ ਨਹੀਂ ਹੋਈ',
      quickActions: 'ਖੇਤੀਬਾੜੀ ਟੂਲ',
      soilScanAction: 'ਸਕੈਨ (Scan)',
      soilScanDesc: 'ਪੱਤਿਆਂ ਦੀ ਜਾਂਚ, ਮਿੱਟੀ ਦੀ ਬਣਤਰ ਤੇ ਏਆਈ ਸਲਾਹ',
      aiAdvisorAction: 'ਏਆਈ ਸਲਾਹਕਾਰ',
      aiAdvisorDesc: 'ਖੇਤੀ ਮਾਹਿਰ ਨਾਲ ਸਲਾਹ ਕਰੋ',
      cropDoctorAction: 'ਫ਼ਸਲ ਡਾਕਟਰ',
      cropDoctorDesc: 'ਫ਼ਸਲ ਦੇ ਲੱਛਣ ਦਰਜ ਕਰੋ ਅਤੇ ਸੁਝਾਅ ਪੜ੍ਹੋ',
      fertilizerAction: 'ਖਾਦ ਸਲਾਹ',
      fertilizerDesc: 'ਫ਼ਸਲ ਅਨੁਸਾਰ ਸੰਤੁਲਿਤ ਖਾਦ ਪ੍ਰਬੰਧਨ',
      marketplaceAction: 'ਮੰਡੀ ਬਾਜ਼ਾਰ',
      marketplaceDesc: 'ਫ਼ਸਲ ਵੇਚਣ ਲਈ ਖ਼ਰੀਦਦਾਰਾਂ ਨਾਲ ਜੁੜੋ',
      weatherTitle: 'ਮੌਸਮ ਜਾਣਕਾਰੀ',
      weatherUnavailable: 'ਲਾਈਵ ਮੌਸਮ ਸੇਵਾ ਫਿਲਹਾਲ ਉਪਲਬਧ ਨਹੀਂ',
      weatherNotice: 'ਸਟੇਜ 1 ਮੁਫ਼ਤ ਵਰਜਨ ਹੈ। ਸੈਟੇਲਾਈਟ ਮੌਸਮ ਜਲਦੀ ਆਵੇਗਾ।',
      recentActivity: 'ਤਾਜ਼ਾ ਗਤੀਵਿਧੀ',
    },
    myFarm: {
      title: 'ਮੇਰਾ ਖੇਤ',
      subtitle: 'ਖੇਤ ਦਾ ਰਿਕਾਰਡ ਤੇ ਫ਼ਸਲ ਚੱਕਰ',
      editFarm: 'ਖੇਤ ਜਾਣਕਾਰੀ ਬਦਲੋ',
      addCrop: 'ਨਵੀਂ ਫ਼ਸਲ ਸ਼ਾਮਲ ਕਰੋ',
      addObservation: 'ਨੋਟ ਦਰਜ ਕਰੋ',
      activeCropsTab: 'ਚੱਲ ਰਹੀਆਂ ਫ਼ਸਲਾਂ',
      observationsTab: 'ਖੇਤ ਦੇ ਨੋਟ',
      soilTestsTab: 'ਮਿੱਟੀ ਟੈਸਟ ਰਿਕਾਰਡ',
      emptyCropsTitle: 'ਕੋਈ ਫ਼ਸਲ ਦਰਜ ਨਹੀਂ ਹੈ',
      emptyCropsDesc: 'ਆਪਣੀ ਫ਼ਸਲ ਸ਼ਾਮਲ ਕਰੋ ਅਤੇ ਵਿਕਾਸ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ।',
      growthStage: 'ਵਿਕਾਸ ਅਵਸਥਾ',
      sowingDate: 'ਬਿਜਾਈ ਦੀ ਮਿਤੀ',
      harvestEst: 'ਕਟਾਈ ਦਾ ਅੰਦਾਜ਼ਾ',
      diagnoseProblem: 'ਲੱਛਣ ਜਾਂਚੋ',
      fertilizerGuidance: 'ਖਾਦ ਦੀ ਲੋੜ',
    },
    soilScan: {
      title: 'ਮਿੱਟੀ ਜਾਂਚ',
      tagline: 'ਆਪਣੀ ਮਿੱਟੀ ਨੂੰ ਵਿਗਿਆਨਿਕ ਢੰਗ ਨਾਲ ਸਮਝੋ',
      scientificDisclaimer: 'ਸੂਚਨਾ: ਫ਼ੋਟੋ ਨਾਲ ਸਹੀ pH ਜਾਂ ਨਾਈਟ੍ਰੋਜਨ ਦਾ ਪਤਾ ਨਹੀਂ ਲੱਗਦਾ। ਪੱਕੇ ਰਿਕਾਰਡ ਲਈ ਲੈਬ ਟੈਸਟ ਜ਼ਰੂਰੀ ਹੈ।',
      photoStep: '੧. ਮਿੱਟੀ ਦੀ ਫ਼ੋਟੋ',
      photoInstruction: 'ਆਪਣੇ ਖੇਤ ਦੀ ਮਿੱਟੀ ਦੀ ਸਾਫ਼ ਫ਼ੋਟੋ ਚੁਣੋ।',
      contextStep: '੨. ਖੇਤ ਦਾ ਵੇਰਵਾ',
      labStep: '੩. ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ (ਵਿਕਲਪਿਕ)',
      submitScan: 'ਵੇਰਵਾ ਦਰਜ ਕਰੋ',
      resultsSummary: 'ਮਿੱਟੀ ਰਿਪੋਰਟ ਸੰਖੇਪ',
      statusUnavailableAI: 'AI ਜਾਂਚ ਅਜੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਇਹ ਤੁਹਾਡੇ ਦਰਜ ਡੇਟਾ ਦਾ ਸਾਰ ਹੈ।',
    },
    cropDoctor: {
      title: 'ਫ਼ਸਲ ਡਾਕਟਰ',
      subtitle: 'ਲੱਛਣ ਜਾਂਚੋ ਤੇ ਸਹੀ ਸਲਾਹ ਲਵੋ',
      notice: 'ਸਵੈਚਾਲਤ AI ਨਿਦਾਨ ਹਾਲੇ ਸ਼ਾਮਲ ਨਹੀਂ ਹੈ। ਦਵਾਈ ਵਰਤਣ ਤੋਂ ਪਹਿਲਾਂ KVK ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
      selectCrop: 'ਫ਼ਸਲ ਚੁਣੋ',
      selectStage: 'ਅਵਸਥਾ',
      describeIssue: 'ਸਮੱਸਿਆ ਦੱਸੋ',
      photoOptional: 'ਫ਼ੋਟੋ (ਵਿਕਲਪਿਕ)',
      submitProblem: 'ਜਾਂਚ ਸੂਚੀ ਦੇਖੋ',
    },
    fertilizer: {
      title: 'ਖਾਦ ਸਲਾਹ',
      subtitle: 'ਸੰਤੁਲਿਤ ਖਾਦ ਦੀ ਵਰਤੋਂ',
      notice: 'ਮਿੱਟੀ ਪਰਖ ਅਨੁਸਾਰ ਹੀ ਖਾਦ ਵਰਤੋ। ਬੇਲੋੜੀ ਖਾਦ ਤੋਂ ਬਚੋ।',
      selectCrop: 'ਫ਼ਸਲ',
      selectStage: 'ਅਵਸਥਾ',
      soilTestStatus: 'ਮਿੱਟੀ ਟੈਸਟ ਸਥਿਤੀ',
      calculateGuidance: 'ਸਲਾਹ ਦੇਖੋ',
    },
    marketplace: {
      title: 'ਮੰਡੀ ਬਾਜ਼ਾਰ',
      subtitle: 'ਫ਼ਸਲ ਦੀ ਵਿਕਰੀ ਲਈ ਖ਼ਰੀਦਦਾਰ',
      demoNotice: 'ਨਮੂਨਾ ਡੇਟਾ (Demonstration Data) — ਅਸਲੀ ਮੰਡੀ ਭਾਅ ਜਲਦੀ ਸ਼ਾਮਲ ਕੀਤੇ ਜਾਣਗੇ।',
      searchPlaceholder: 'ਫ਼ਸਲ ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਲੱਭੋ...',
      allCategories: 'ਸਾਰੀਆਂ ਫ਼ਸਲਾਂ',
      listProduceBtn: 'ਆਪਣੀ ਉਪਜ ਦਰਜ ਕਰੋ',
      sampleDataBadge: 'ਨਮੂਨਾ ਡੇਟਾ (DEMO)',
      contactSeller: 'ਸੰਪਰਕ ਕਰੋ',
    },
    profile: {
      title: 'ਪ੍ਰੋਫਾਈਲ ਤੇ ਸੈਟਿੰਗਜ਼',
      farmerDetails: 'ਕਿਸਾਨ ਤੇ ਖੇਤ ਵੇਰਵਾ',
      language: 'ਐਪ ਦੀ ਭਾਸ਼ਾ',
      units: 'ਮਾਪ ਇਕਾਈਆਂ',
      storageInfo: 'ਡੇਟਾ ਸੁਰੱਖਿਆ',
      resetDemoData: 'ਡੇਟਾ ਰੀਸੈੱਟ ਕਰੋ',
      exportBackup: 'ਬੈਕਅੱਪ ਡਾਊਨਲੋਡ ਕਰੋ (JSON)',
      importBackup: 'ਬੈਕਅੱਪ ਰੀਸਟੋਰ ਕਰੋ (JSON)',
    },
  }),
  mr: createLangDict({
    appName: 'AgriConnect',
    tagline: 'तपासा. समजून घ्या. पिकवा. कमवा.',
    subTagline: 'स्मार्ट शेती. योग्य कमाई.',
    tabs: {
      home: 'मुख्यपृष्ठ',
      myFarm: 'माझे शेत',
      soilScan: 'माती तपासणी',
      marketplace: 'बाजारपेठ',
      profileSettings: 'प्रोफाइल व सेटिंग्ज',
    },
    home: {
      welcomeGreeting: 'नमस्कार,',
      taglineHeading: 'तुमची शेती, आता स्मार्ट.',
      overviewTitle: 'शेतीचा आढावा',
      activeCrops: 'सध्याची पिके',
      totalLand: 'एकूण जमीन',
      soilHealth: 'मृदा नोंदी',
      cropHealth: 'पीक आरोग्य',
      notAssessedYet: 'अद्याप तपासणी नाही',
      quickActions: 'शेती साधने',
      soilScanAction: 'स्कॅन (Scan)',
      soilScanDesc: 'पानांची तपासणी, मातीचा पोत आणि एआय सल्ला',
      aiAdvisorAction: 'एआय सल्लागार',
      aiAdvisorDesc: 'शेती तज्ञांशी त्वरित सल्लामसलत करा',
      cropDoctorAction: 'पीक डॉक्टर',
      cropDoctorDesc: 'रोगाची लक्षणे नोंदवा व उपाय तपासा',
      fertilizerAction: 'खत मार्गदर्शन',
      fertilizerDesc: 'पिकाच्या अवस्थेनुसार खतांचे नियोजन',
      marketplaceAction: 'कृषी बाजार',
      marketplaceDesc: 'उत्पादन विका आणि खरेदीदार शोधा',
      weatherTitle: 'हवामान अंदाज',
      weatherUnavailable: 'थेट हवामान सेवा सध्या जोडलेली नाही',
      weatherNotice: 'टप्पा १ मोफत आवृत्ती आहे. लवकरच थेट हवामान जोडले जाईल.',
      recentActivity: 'अलीकडील नोंदी',
    },
    myFarm: {
      title: 'माझे शेत',
      subtitle: 'शेत नोंदी आणि पीक वाढीचा टप्पा',
      editFarm: 'माहिती बदला',
      addCrop: 'नवीन पीक जोडा',
      addObservation: 'नोंद करा',
      activeCropsTab: 'सध्याची पिके',
      observationsTab: 'शेतातील नोंदी',
      soilTestsTab: 'माती परीक्षण नोंदी',
      emptyCropsTitle: 'पिकांची नोंद नाही',
      emptyCropsDesc: 'पिकांची नोंद करून वाढीचा टप्पा तपासा.',
      growthStage: 'वाढीचा टप्पा',
      sowingDate: 'पेरणीची तारीख',
      harvestEst: 'कापणी अंदाज',
      diagnoseProblem: 'लक्षणे तपासा',
      fertilizerGuidance: 'खतांची गरज',
    },
    soilScan: {
      title: 'माती तपासणी',
      tagline: 'विज्ञानावर आधारित माती समजून घ्या',
      scientificDisclaimer: 'सूचना: केवळ छायाचित्रावरून pH किंवा नायट्रोजन समजत नाही. अचूकतेसाठी प्रयोगशाळा चाचणी आवश्यक आहे.',
      photoStep: '१. मातीचा फोटो',
      photoInstruction: 'वरच्या थराच्या मातीचा स्पष्ट फोटो निवडा.',
      contextStep: '२. शेताचा संदर्भ',
      labStep: '३. मृदा आरोग्य पत्रिका (ऐच्छिक)',
      submitScan: 'नोंद करा',
      resultsSummary: 'माती अहवाल',
      statusUnavailableAI: 'स्वयंचलित AI अद्याप उपलब्ध नाही. हा तुमच्या नोंदींचा सारांश आहे.',
    },
    cropDoctor: {
      title: 'पीक डॉक्टर',
      subtitle: 'रोगाची लक्षणे तपासा',
      notice: 'स्वयंचलित AI अद्याप उपलब्ध नाही. कीटकनाशक वापरण्यापूर्वी कृषी विज्ञान केंद्राचा सल्ला घ्या.',
      selectCrop: 'पीक निवडा',
      selectStage: 'वाढीचा टप्पा',
      describeIssue: 'लक्षणे सांगा',
      photoOptional: 'फोटो (ऐच्छिक)',
      submitProblem: 'तपासणी सूची पहा',
    },
    fertilizer: {
      title: 'खत मार्गदर्शन',
      subtitle: 'संतुलित खतांचा वापर',
      notice: 'माती परीक्षणानुसारच खतांचा वापर करा.',
      selectCrop: 'पीक',
      selectStage: 'टप्पा',
      soilTestStatus: 'माती परीक्षण स्थिती',
      calculateGuidance: 'मार्गदर्शन पहा',
    },
    marketplace: {
      title: 'कृषी बाजारपेठ',
      subtitle: 'शेतकरी आणि व्यापारी थेट संपर्क',
      demoNotice: 'डेमो बाजारपेठ डेटा — थेट बाजारभाव पुढील टप्प्यात उपलब्ध होतील.',
      searchPlaceholder: 'पीक किंवा जिल्हा शोधा...',
      allCategories: 'सर्व उत्पादने',
      listProduceBtn: 'तुमचे उत्पादन जोडा',
      sampleDataBadge: 'डेमो डेटा (DEMO)',
      contactSeller: 'संपर्क साधा',
    },
    profile: {
      title: 'प्रोफाइल व सेटिंग्ज',
      farmerDetails: 'शेतकरी तपशील',
      language: 'अ‍ॅपची भाषा',
      units: 'मोजमाप एकके',
      storageInfo: 'डेटा गोपनीयता',
      resetDemoData: 'डेमो डेटा रीसेट करा',
      exportBackup: 'बॅकअप डाउनलोड करा (JSON)',
      importBackup: 'बॅकअप रिस्टोअर करा (JSON)',
    },
  }),
  te: createLangDict({
    appName: 'AgriConnect',
    tagline: 'స్కాన్ చేయండి. గ్రహించండి. పండించండి. సంపాదించండి.',
    subTagline: 'స్మార్ట్ వ్యవసాయం. సరసమైన ఆదాయం.',
    tabs: {
      home: 'హోమ్',
      myFarm: 'నా పొలం',
      soilScan: 'నేల స్కాన్',
      marketplace: 'మార్కెట్',
      profileSettings: 'ప్రొఫైల్ & సెట్టింగ్‌లు',
    },
    home: {
      welcomeGreeting: 'నమస్కారం,',
      taglineHeading: 'మీ వ్యవసాయం, మరింత స్మార్ట్.',
      overviewTitle: 'వ్యవసాయ సారాంశం',
      activeCrops: 'సాగులో ఉన్న పంటలు',
      totalLand: 'మొత్తం భూమి',
      soilHealth: 'నేల రికార్డులు',
      cropHealth: 'పంట ఆరోగ్యం',
      notAssessedYet: 'ఇంకా అంచనా వేయలేదు',
      quickActions: 'వ్యవసాయ పరికరాలు',
      soilScanAction: 'స్కాన్ (Scan)',
      soilScanDesc: 'ఆకుల పరీక్ష, నేల తీరు మరియు ఏఐ సలహా',
      aiAdvisorAction: 'ఏఐ సలహాదారు',
      aiAdvisorDesc: 'వ్యవసాయ నిపుణుడితో మాట్లాడండి',
      cropDoctorAction: 'క్రాప్ డాక్టర్',
      cropDoctorDesc: 'పంట సమస్యలు నమోదు చేసి తనిఖీ జాబితా చూడండి',
      fertilizerAction: 'ఎరువుల సలహా',
      fertilizerDesc: 'దశల వారీగా సమతుల్య పోషకాల నిర్వహణ',
      marketplaceAction: 'రైతు మార్కెట్',
      marketplaceDesc: 'పంటను అమ్మండి మరియు కొనుగోలుదారులను కలవండి',
      weatherTitle: 'వాతావరణం',
      weatherUnavailable: 'లైవ్ వాతావరణ సేవ ఇంకా కనెక్ట్ కాలేదు',
      weatherNotice: 'మొదటి దశ ఉచిత మోడల్. శాటిలైట్ డేటా త్వరలో అందుబాటులోకి వస్తుంది.',
      recentActivity: 'ఇటీవలి సమాచారం',
    },
    myFarm: {
      title: 'నా పొలం',
      subtitle: 'పొలం రికార్డులు మరియు పంట దశలు',
      editFarm: 'వివరాలు మార్చండి',
      addCrop: 'కొత్త పంట చేర్చండి',
      addObservation: 'గమనిక నమోదు చేయండి',
      activeCropsTab: 'సాగులో ఉన్న పంటలు',
      observationsTab: 'క్షేత్ర గమనికలు',
      soilTestsTab: 'నేల పరీక్షలు',
      emptyCropsTitle: 'పంటలు ఇంకా చేర్చలేదు',
      emptyCropsDesc: 'పంటలను జోడించి పెరుగుదల దశలను ట్రాక్ చేయండి.',
      growthStage: 'పెరుగుదల దశ',
      sowingDate: 'విత్తిన తేదీ',
      harvestEst: 'కోత అంచనా',
      diagnoseProblem: 'సమస్యను పరిశీలించండి',
      fertilizerGuidance: 'ఎరువుల అవసరాలు',
    },
    soilScan: {
      title: 'నేల స్కాన్',
      tagline: 'శాస్త్రీయంగా మీ నేలను అర్థం చేసుకోండి',
      scientificDisclaimer: 'గమనిక: ఫోటో ద్వారా ఖచ్చితమైన pH లేదా నత్రజని తెలియదు. ల్యాబ్ పరీక్ష ముఖ్యం.',
      photoStep: '౧. నేల ఫోటో',
      photoInstruction: 'పైభాగపు నేల స్పష్టమైన ఫోటో ఎంచుకోండి.',
      contextStep: '౨. పొలం సమాచారం',
      labStep: '౩. నేల ఆరోగ్య కార్డు (ఐచ్ఛికం)',
      submitScan: 'నమోదు చేయండి',
      resultsSummary: 'నేల నివేదిక',
      statusUnavailableAI: 'ఆటోమేటిక్ AI ఇంకా అందుబాటులో లేదు.',
    },
    cropDoctor: {
      title: 'క్రాప్ డాక్టర్',
      subtitle: 'లక్షణాలు నమోదు చేయండి',
      notice: 'ఆటోమేటిక్ AI ఇంకా అందుబాటులో లేదు. మందుల వాడకానికి KVK ని సంప్రదించండి.',
      selectCrop: 'పంటను ఎంచుకోండి',
      selectStage: 'దశ',
      describeIssue: 'సమస్యను వివరించండి',
      photoOptional: 'ఫోటో (ఐచ్ఛికం)',
      submitProblem: 'జాబితా చూడండి',
    },
    fertilizer: {
      title: 'ఎరువుల సలహా',
      subtitle: 'సమతుల్య ఎరువుల వినియోగం',
      notice: 'నేల పరీక్షల ఆధారంగానే ఎరువులను వాడండి.',
      selectCrop: 'పంట',
      selectStage: 'దశ',
      soilTestStatus: 'నేల పరీక్ష స్థితి',
      calculateGuidance: 'సలహాలు చూడండి',
    },
    marketplace: {
      title: 'రైతు మార్కెట్',
      subtitle: 'రైతులు మరియు వ్యాపారుల వేదిక',
      demoNotice: 'నమూనా డేటా (Demonstration Data) — అసలు మార్కెట్ ధరలు త్వరలో వస్తాయి.',
      searchPlaceholder: 'పంట లేదా జిల్లా వెతకండి...',
      allCategories: 'అన్ని పంటలు',
      listProduceBtn: 'మీ పంటను అమ్మకానికి పెట్టండి',
      sampleDataBadge: 'డెమో డేటా (DEMO)',
      contactSeller: 'సంప్రదించండి',
    },
    profile: {
      title: 'ప్రొఫైల్ & సెట్టింగ్‌లు',
      farmerDetails: 'రైతు వివరాలు',
      language: 'భాష',
      units: 'కొలత ప్రమాణాలు',
      storageInfo: 'డేటా భద్రత',
      resetDemoData: 'డేటాను రీసెట్ చేయండి',
      exportBackup: 'బ్యాకప్ డౌన్‌లోడ్ (JSON)',
      importBackup: 'రీస్టోర్ చేయండి (JSON)',
    },
  }),
  ta: createLangDict({
    appName: 'AgriConnect',
    tagline: 'ஸ்கேன் செய். புரிந்துகொள். பயிரிடு. சம்பாதி.',
    subTagline: 'ஸ்மார்ட் விவசாயம். நியாயமான வருமானம்.',
    tabs: {
      home: 'முகப்பு',
      myFarm: 'என் பண்ணை',
      soilScan: 'மண் பரிசோதனை',
      marketplace: 'சந்தை',
      profileSettings: 'சுயவிவரம் & அமைப்புகள்',
    },
    home: {
      welcomeGreeting: 'வணக்கம்,',
      taglineHeading: 'உங்கள் விவசாயம், இனி ஸ்மார்ட்.',
      overviewTitle: 'பண்ணை விவரம்',
      activeCrops: 'பயிரிடப்பட்ட பயிர்கள்',
      totalLand: 'மொத்த நிலம்',
      soilHealth: 'மண் பதிவுகள்',
      cropHealth: 'பயிர் ஆரோக்கியம்',
      notAssessedYet: 'இன்னும் மதிப்பிடப்படவில்லை',
      quickActions: 'விவசாயக் கருவிகள்',
      soilScanAction: 'ஸ்கேன் (Scan)',
      soilScanDesc: 'இலை ஆய்வு, மண் தரம் மற்றும் AI ஆலோசனை',
      aiAdvisorAction: 'AI ஆலோசகர்',
      aiAdvisorDesc: 'வேளாண் நிபுணரிடம் ஆலோசனை பெறவும்',
      cropDoctorAction: 'பயிர் மருத்துவர்',
      cropDoctorDesc: 'பயிர் நோயறிகுறிகளை பதிவு செய்து சரிபார்க்கவும்',
      fertilizerAction: 'உர வழிகாட்டுதல்',
      fertilizerDesc: 'வளர்ச்சி நிலைக்கு ஏற்ப உர மேலாண்மை',
      marketplaceAction: 'விவசாய சந்தை',
      marketplaceDesc: 'விளைபொருட்களை விற்கவும் வியாபாரிகளை அணுகவும்',
      weatherTitle: 'வானிலை தகவல்',
      weatherUnavailable: 'நேரலை வானிலை சேவை இன்னும் இணைக்கப்படவில்லை',
      weatherNotice: 'முதல் நிலை இலவச பதிப்பாகும். விரைவில் செயற்கைக்கோள் வானிலை சேர்க்கப்படும்.',
      recentActivity: 'சமீபத்திய நிகழ்வுகள்',
    },
    myFarm: {
      title: 'என் பண்ணை',
      subtitle: 'பண்ணை பதிவுகள் மற்றும் பயிர் சுழற்சி',
      editFarm: 'விவரங்களை மாற்றவும்',
      addCrop: 'புதிய பயிர் சேர்க்கவும்',
      addObservation: 'குறிப்பு எடுக்கவும்',
      activeCropsTab: 'பயிர்கள்',
      observationsTab: 'களக் குறிப்புகள்',
      soilTestsTab: 'மண் பரிசோதனை பதிவுகள்',
      emptyCropsTitle: 'பயிர்கள் எதுவும் சேர்க்கப்படவில்லை',
      emptyCropsDesc: 'பயிர்களைச் சேர்த்து வளர்ச்சிப் பருவத்தைக் கண்காணிக்கவும்.',
      growthStage: 'வளர்ச்சி நிலை',
      sowingDate: 'விதைத்த தேதி',
      harvestEst: 'அறுவடை மதிப்பீடு',
      diagnoseProblem: 'அறிகுறிகள்',
      fertilizerGuidance: 'உரத் தேவை',
    },
    soilScan: {
      title: 'மண் பரிசோதனை',
      tagline: 'அறிவியல் பூர்வமாக உங்கள் மண்ணைப் புரிந்து கொள்ளுங்கள்',
      scientificDisclaimer: 'அறிவிப்பு: புகைப்படத்தால் மட்டுமே துல்லியமான pH அல்லது நைட்ரஜனை அறிய முடியாது. ஆய்வகப் பரிசோதனை அவசியம்.',
      photoStep: '1. மண் புகைப்படம்',
      photoInstruction: 'மேல் மண்ணின் தெளிவான புகைப்படத்தைத் தேர்வு செய்யவும்.',
      contextStep: '2. பண்ணை சூழல்',
      labStep: '3. மண் சுகாதார அட்டை (விருப்பமானது)',
      submitScan: 'பதிவு செய்யவும்',
      resultsSummary: 'மண் அறிக்கை',
      statusUnavailableAI: 'தானியங்கி AI இன்னும் இணைக்கப்படவில்லை.',
    },
    cropDoctor: {
      title: 'பயிர் மருத்துவர்',
      subtitle: 'அறிகுறிகளைப் பதிவு செய்யவும்',
      notice: 'தானியங்கி AI இன்னும் தயாராகவில்லை. பூச்சிக்கொல்லி மருந்துகளுக்கு KVK ஐ அணுகவும்.',
      selectCrop: 'பயிர் தேர்வு',
      selectStage: 'நிலை',
      describeIssue: 'பிரச்சனையை விவரிக்கவும்',
      photoOptional: 'புகைப்படம் (விருப்பமானது)',
      submitProblem: 'பட்டியலைப் பார்க்கவும்',
    },
    fertilizer: {
      title: 'உர வழிகாட்டுதல்',
      subtitle: 'சரியான ஊட்டச்சத்து வழிகாட்டல்',
      notice: 'மண் பரிசோதனை அறிக்கையின்படி மட்டுமே உரங்களை இடவும்.',
      selectCrop: 'பயிர்',
      selectStage: 'நிலை',
      soilTestStatus: 'மண் பரிசோதனை நிலை',
      calculateGuidance: 'வழிகாட்டுதலைப் பார்க்கவும்',
    },
    marketplace: {
      title: 'விவசாய சந்தை',
      subtitle: 'விவசாயிகள் மற்றும் கொள்முதல் செய்பவர்கள் தளம்',
      demoNotice: 'மாதிரி சந்தை தரவு (Demonstration Data) — நேரடி விலை நிலவரங்கள் விரைவில் வரும்.',
      searchPlaceholder: 'பயிர் அல்லது மாவட்டத்தைத் தேடவும்...',
      allCategories: 'அனைத்து விளைபொருட்கள்',
      listProduceBtn: 'பொருட்களை பட்டியலிடவும்',
      sampleDataBadge: 'டெமோ தரவு (DEMO)',
      contactSeller: 'தொடர்பு கொள்ளவும்',
    },
    profile: {
      title: 'சுயவிவரம் & அமைப்புகள்',
      farmerDetails: 'விவசாயி விவரங்கள்',
      language: 'பயன்பாட்டு மொழி',
      units: 'அளவீட்டு அலகுகள்',
      storageInfo: 'தரவு பாதுகாப்பு',
      resetDemoData: 'தரவை மீட்டமைக்க',
      exportBackup: 'காப்புப்பிரதி பதிவிறக்கம் (JSON)',
      importBackup: 'மீட்டெடு (JSON)',
    },
  }),
  kn: {
    appName: 'AgriConnect',
    tagline: 'ಸ್ಕ್ಯಾನ್ ಮಾಡಿ. ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ. ಬೆಳೆಯಿರಿ. ಗಳಿಸಿ.',
    subTagline: 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ. ನ್ಯಾಯಯುತ ಆದಾಯ.',
    tabs: {
      home: 'ಮುಖಪುಟ',
      myFarm: 'ನನ್ನ ಜಮೀನು',
      soilScan: 'ಮಣ್ಣು ಸ್ಕ್ಯಾನ್',
      marketplace: 'ಮಾರುಕಟ್ಟೆ',
      profileSettings: 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್ಸ್',
      browseCrops: 'ಬೆಳೆಗಳನ್ನು ಹುಡುಕಿ',
      myEnquiries: 'ನನ್ನ ವಿಚಾರಣೆಗಳು',
    },
    auth: {
      signInTab: 'ಸೈನ್ ಇನ್',
      createAccountTab: 'ಹೊಸ ಖಾತೆ ತೆರೆಯಿರಿ',
      welcomeTitle: 'ಅಗ್ರಿಕನೆಕ್ಟ್‌ಗೆ ಸುಸ್ವಾಗತ',
      welcomeSubtitle: 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ. ನೇರ ಮಾರುಕಟ್ಟೆ. ನ್ಯಾಯಯುತ ಆದಾಯ.',
      chooseRole: 'ನಿಮ್ಮ ಖಾತೆಯ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      farmerRole: 'ನಾನು ರೈತ / ಬೆಳೆಗಾರ',
      farmerRoleDesc: 'ಮಣ್ಣು ಸ್ಕ್ಯಾನ್, ಬೆಳೆ ದಾಖಲೆಗಳು ಮತ್ತು ಸಗಟು ಖರೀದಿದಾರರಿಗೆ ನೇರ ಮಾರಾಟ.',
      buyerRole: 'ನಾನು ವ್ಯಾಪಾರಿ / ಖರೀದಿದಾರ',
      buyerRoleDesc: 'ರೈತರಿಂದ ನೇರವಾಗಿ ತಾಜಾ ಕೃಷಿ ಉತ್ಪನ್ನಗಳನ್ನು ಖರೀದಿಸಿ.',
      fullNameLabel: 'ಪೂರ್ಣ ಹೆಸರು',
      fullNamePlaceholder: 'ಉದಾ: ಅನನ್ಯಾ ಪಾಟೀಲ್',
      emailLabel: 'ಇಮೇಲ್ ವಿಳಾಸ',
      emailPlaceholder: 'agriconnect.farmer.test@example.com',
      passwordLabel: 'ಪಾಸ್‌ವರ್ಡ್',
      confirmPasswordLabel: 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
      districtLabel: 'ಗ್ರಾಮ / ತಾಲೂಕು / ಜಿಲ್ಲೆ',
      districtPlaceholder: 'ವಿಜಯಪುರ',
      farmAreaLabel: 'ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ)',
      businessNameLabel: 'ವ್ಯಾಪಾರ ಸಂಸ್ಥೆಯ ಹೆಸರು',
      businessNamePlaceholder: 'ವಿಜಯಪುರ ಕೃಷಿ ಟ್ರೇಡರ್ಸ್',
      businessTypeLabel: 'ವ್ಯಾಪಾರ ಪ್ರಕಾರ',
      signInBtn: 'ಸೈನ್ ಇನ್ ಮಾಡಿ',
      registerBtn: 'ನೋಂದಾಯಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ',
      forgotPasswordLink: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',
      forgotPasswordTitle: 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ',
      forgotPasswordDesc: 'ನಿಮ್ಮ ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.',
      sendResetCodeBtn: 'ಮರುಹೊಂದಿಸುವ ಕೋಡ್ ಕಳುಹಿಸಿ',
      resetCodeLabel: 'ಮರುಪಡೆಯುವಿಕೆ ಕೋಡ್',
      newPasswordLabel: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್',
      confirmNewPasswordLabel: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
      resetPasswordBtn: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಉಳಿಸಿ',
      backToSignIn: 'ಸೈನ್ ಇನ್‌ಗೆ ಹಿಂತಿರುಗಿ',
      quickTestFarmerBtn: 'ರೈತರ ಪರೀಕ್ಷಾ ವಿವರಗಳು (ಅನನ್ಯಾ ಪಾಟೀಲ್)',
      quickTestBuyerBtn: 'ಖರೀದಿದಾರರ ಪರೀಕ್ಷಾ ವಿವರಗಳು',
      testNotice: 'ಪರೀಕ್ಷಾ ವಿವರಗಳು: ನಿಮ್ಮ ಇಷ್ಟದ ಪಾಸ್‌ವರ್ಡ್ ಆಯ್ಕೆಮಾಡಿ (ಕನಿಷ್ಠ ೬ ಅಕ್ಷರಗಳು).',
      errorPassMismatch: 'ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.',
      errorPassLength: 'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ ೬ ಅಕ್ಷರಗಳಿರಬೇಕು.',
      errorInvalidEmail: 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.',
      errorNameRequired: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.',
      successRegistered: 'ಖಾತೆ ಯಶಸ್ವಿಯಾಗಿ ರಚನೆಯಾಗಿದೆ! ಅಗ್ರೋವಾಗೆ ಸುಸ್ವಾಗತ.',
      successLoggedIn: 'ಯಶಸ್ವಿಯಾಗಿ ಲಾಗಿನ್ ಆಗಿದೆ!',
      successPassReset: 'ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಗಿದೆ. ಸೈನ್ ಇನ್ ಮಾಡಿ.',
    },
    buyer: {
      welcome: 'ಸುಸ್ವಾಗತ',
      subheading: 'ರೈತರಿಂದ ನೇರ ಸಗಟು ಖರೀದಿ ವೇದಿಕೆ',
      availableLots: 'ಲಭ್ಯವಿರುವ ಬೆಳೆಗಳು',
      myEnquiries: 'ನನ್ನ ವಿಚಾರಣೆಗಳು',
      awaitingReply: 'ಉತ್ತರಕ್ಕೆ ಕಾಯುತ್ತಿರುವ',
      quickSearchPlaceholder: 'ಬೆಳೆ, ತಳಿ ಅಥವಾ ಜಿಲ್ಲೆ ಹುಡುಕಿ...',
      browseCropsTitle: 'ಬೆಳೆಗಳನ್ನು ಹುಡುಕಿ',
      browseCropsSubtitle: 'ಕರ್ನಾಟಕ ಮತ್ತು ಪ್ರಾದೇಶಿಕ ಮಂಡಿಗಳಿಂದ ಪರಿಶೀಲಿಸಿದ ರೈತರ ಬೆಳೆಗಳು',
      allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
      allMandiSources: 'ಎಲ್ಲಾ ಮೂಲಗಳು',
      verifiedGrowersOnly: 'ರೈತರ ನೇರ ಬೆಳೆಗಳು',
      demoLotsOnly: 'ಮಾದರಿ ಬೆಳೆಗಳು (ಡೆಮೊ)',
      sendEnquiry: 'ಖರೀದಿ ವಿಚಾರಣೆ ಕಳುಹಿಸಿ',
      enquiryModalTitle: 'ರೈತರಿಗೆ ಖರೀದಿ ಪ್ರಸ್ತಾಪ ಕಳುಹಿಸಿ',
      enquiryModalSubtitle: 'ಉತ್ಪನ್ನದ ಲಭ್ಯತೆ, ದರ ಮತ್ತು ಮಾದರಿಗಾಗಿ ರೈತರನ್ನು ಸಂಪರ್ಕಿಸಿ',
      buyerNameLabel: 'ನಿಮ್ಮ ಹೆಸರು',
      buyerPhoneLabel: 'ಸಂಪರ್ಕ ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
      buyerBusinessLabel: 'ಸಂಸ್ಥೆ / ಮಂಡಿ ಹೆಸರು',
      requestedQtyLabel: 'ಅಗತ್ಯವಿರುವ ಪ್ರಮಾಣ (ಕ್ವಿಂಟಾಲ್)',
      offeredPriceLabel: 'ನೀವು ನೀಡುವ ದರ (₹ / ಕ್ವಿಂಟಾಲ್)',
      messageLabel: 'ಸಂದೇಶ / ಸೂಚನೆ',
      submitEnquiryBtn: 'ವಿಚಾರಣೆ ಕಳುಹಿಸಿ',
      cancelBtn: 'ರದ್ದುಮಾಡಿ',
      enquirySuccess: 'ನಿಮ್ಮ ಖರೀದಿ ವಿಚಾರಣೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ!',
      myEnquiriesTitle: 'ನನ್ನ ಖರೀದಿ ವಿಚಾರಣೆಗಳು',
      myEnquiriesSubtitle: 'ರೈತರಿಗೆ ಸಲ್ಲಿಸಲಾದ ಖರೀದಿ ಉಲ್ಲೇಖಗಳು ಮತ್ತು ಸಂವಹನ',
      filterAll: 'ಎಲ್ಲಾ',
      filterPending: 'ಬಾಕಿ ಇರುವ',
      filterContacted: 'ಸಂಪರ್ಕಿಸಲಾಗಿದೆ',
      filterAccepted: 'ಸ್ವೀಕರಿಸಲಾಗಿದೆ',
      noEnquiriesTitle: 'ಯಾವುದೇ ವಿಚಾರಣೆಗಳಿಲ್ಲ',
      noEnquiriesDesc: 'ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಬೆಳೆಗೆ ವಿಚಾರಣೆ ಕಳುಹಿಸಿಲ್ಲ. ಬೆಳೆಗಳನ್ನು ಹುಡುಕಿ ಮತ್ತು ಪ್ರಸ್ತಾಪ ಕಳುಹಿಸಿ.',
      directGrowerContact: 'ರೈತರ ನೇರ ಸಂಪರ್ಕ',
      mandiPriceTrendsTitle: 'ಮಂಡಿ ಬೆಲೆ ಪ್ರವೃತ್ತಿಗಳು',
    },
    home: {
      welcomeGreeting: 'ನಮಸ್ಕಾರ,',
      taglineHeading: 'ನಿಮ್ಮ ಕೃಷಿ, ಇನ್ನು ಸ್ಮಾರ್ಟ್.',
      overviewTitle: 'ಜಮೀನಿನ ವಿವರ',
      activeCrops: 'ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಬೆಳೆಗಳು',
      totalLand: 'ಒಟ್ಟು ಭೂಮಿ',
      soilHealth: 'ಮಣ್ಣಿನ ದಾಖಲೆಗಳು',
      cropHealth: 'ಬೆಳೆ ಆರೋಗ್ಯ',
      notAssessedYet: 'ಇನ್ನೂ ಮೌಲ್ಯಮಾಪನವಾಗಿಲ್ಲ',
      quickActions: 'ಕೃಷಿ ಪರಿಕರಗಳು',
      soilScanAction: 'ಸ್ಕ್ಯಾನ್ (Scan)',
      soilScanDesc: 'ಎಲೆಗಳ ತಪಾಸಣೆ, ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಮತ್ತು ಎಐ ಸಲಹೆ',
      aiAdvisorAction: 'ಎಐ ಸಲಹೆಗಾರ',
      aiAdvisorDesc: 'ಕೃಷಿ ತಜ್ಞರ ಸಲಹೆ ಪಡೆಯಿರಿ',
      cropDoctorAction: 'ಬೆಳೆ ವೈದ್ಯ',
      cropDoctorDesc: 'ರೋಗ ಲಕ್ಷಣ ದಾಖಲಿಸಿ ಸಲಹೆಗಳನ್ನು ಪಡೆಯಿರಿ',
      fertilizerAction: 'ಗೊಬ್ಬರ ಮಾರ್ಗದರ್ಶನ',
      fertilizerDesc: 'ಬೆಳೆಯ ಹಂತಕ್ಕೆ ತಕ್ಕಂತೆ ಗೊಬ್ಬರ ನಿರ್ವಹಣೆ',
      marketplaceAction: 'ಕೃಷಿ ಮಾರುಕಟ್ಟೆ',
      marketplaceDesc: 'ಬೆಳೆ ಮಾರಾಟ ಮತ್ತು ಖರೀದಿದಾರರ ಮಾಹಿತಿ',
      weatherTitle: 'ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ',
      weatherUnavailable: 'ನೇರ ಹವಾಮಾನ ಸೇವೆ ಸದ್ಯಕ್ಕೆ ಲಭ್ಯವಿಲ್ಲ',
      weatherNotice: 'ಇದು ಉಚಿತ ಆವೃತ್ತಿಯಾಗಿದೆ. ಶೀಘ್ರದಲ್ಲೇ ಉಪಗ್ರಹ ಹವಾಮಾನ ಮಾಹಿತಿ ಬರಲಿದೆ.',
      recentActivity: 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ',
    },
    myFarm: {
      title: 'ನನ್ನ ಜಮೀನು',
      subtitle: 'ಜಮೀನಿನ ದಾಖಲೆ ಮತ್ತು ಬೆಳೆ ಹಂತಗಳು',
      editFarm: 'ಮಾಹಿತಿ ಬದಲಾಯಿಸಿ',
      addCrop: 'ಹೊಸ ಬೆಳೆ ಸೇರಿಸಿ',
      addObservation: 'ಟಿಪ್ಪಣಿ ದಾಖಲಿಸಿ',
      activeCropsTab: 'ಬೆಳೆಗಳು',
      observationsTab: 'ಜಮೀನಿನ ಟಿಪ್ಪಣಿಗಳು',
      soilTestsTab: 'ಮಣ್ಣು ಪರೀಕ್ಷೆ ದಾಖಲೆಗಳು',
      emptyCropsTitle: 'ಯಾವುದೇ ಬೆಳೆ ನೋಂದಾಯಿಸಿಲ್ಲ',
      emptyCropsDesc: 'ನಿಮ್ಮ ಬೆಳೆಗಳನ್ನು ಸೇರಿಸಿ ಮತ್ತು ಬೆಳವಣಿಗೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
      growthStage: 'ಬೆಳವಣಿಗೆ ಹಂತ',
      sowingDate: 'ಬಿತ್ತನೆ ದಿನಾಂಕ',
      harvestEst: 'ಕೊಯ್ಲು ಅಂದಾಜು',
      diagnoseProblem: 'ಲಕ್ಷಣಗಳ ತಪಾಸಣೆ',
      fertilizerGuidance: 'ಗೊಬ್ಬರದ ಅವಶ್ಯಕತೆ',
    },
    soilScan: {
      title: 'ಮಣ್ಣು ಸ್ಕ್ಯಾನ್',
      tagline: 'ವೈಜ್ಞಾನಿಕವಾಗಿ ನಿಮ್ಮ ಮಣ್ಣನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ',
      scientificDisclaimer: 'ಸೂಚನೆ: ಕೇವಲ ಫೋಟೋದಿಂದ pH ಅಥವಾ ನೈಟ್ರೋಜನ್ ತಿಳಿಯಲು ಸಾಧ್ಯವಿಲ್ಲ. ಲ್ಯಾಬ್ ಪರೀಕ್ಷೆ ಅಗತ್ಯ.',
      photoStep: '೧. ಮಣ್ಣಿನ ಫೋಟೋ',
      photoInstruction: 'ಮೇಲ್ಮೈ ಮಣ್ಣಿನ ಸ್ಪಷ್ಟ ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ.',
      contextStep: '೨. ಜಮೀನಿನ ವಿವರ',
      labStep: '೩. ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಕಾರ್ಡ್ (ಐಚ್ಛಿಕ)',
      submitScan: 'ದಾಖಲಿಸಿ',
      resultsSummary: 'ಮಣ್ಣಿನ ವರದಿ',
      statusUnavailableAI: 'ಸ್ವಯಂಚಾಲಿತ AI ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.',
    },
    cropDoctor: {
      title: 'ಬೆಳೆ ವೈದ್ಯ',
      subtitle: 'ಲಕ್ಷಣಗಳನ್ನು ದಾಖಲಿಸಿ',
      notice: 'ಸ್ವಯಂಚಾಲಿತ AI ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ. ಕೀಟನಾಶಕಗಳ ಬಳಕೆಗೆ KVK ಸಂಪರ್ಕಿಸಿ.',
      selectCrop: 'ಬೆಳೆ ಆಯ್ಕೆ',
      selectStage: 'ಹಂತ',
      describeIssue: 'ಸಮಸ್ಯೆ ವಿವರಿಸಿ',
      photoOptional: 'ಫೋಟೋ (ಐಚ್ಛಿಕ)',
      submitProblem: 'ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ',
    },
    fertilizer: {
      title: 'ಗೊಬ್ಬರ ಮಾರ್ಗದರ್ಶನ',
      subtitle: 'ಸಮತೋಲಿತ ಪೋಷಕಾಂಶಗಳ ಬಳಕೆ',
      notice: 'ಮಣ್ಣು ಪರೀಕ್ಷೆಯ ಆಧಾರದ ಮೇಲೆ ಮಾತ್ರ ಗೊಬ್ಬರ ಬಳಸಿ.',
      selectCrop: 'ಬೆಳೆ',
      selectStage: 'ಹಂತ',
      soilTestStatus: 'ಮಣ್ಣು ಪರೀಕ್ಷೆ ಸ್ಥಿತಿ',
      calculateGuidance: 'ಮಾರ್ಗದರ್ಶನ ನೋಡಿ',
    },
    marketplace: {
      title: 'ಕೃಷಿ ಮಾರುಕಟ್ಟೆ',
      subtitle: 'ರೈತರು ಮತ್ತು ವ್ಯಾಪಾರಿಗಳ ವೇದಿಕೆ',
      demoNotice: 'ಮಾದರಿ ಮಾರುಕಟ್ಟೆ ಡೇಟಾ (Demonstration Data) — ನೈಜ ಬೆಲೆಗಳು ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿವೆ.',
      searchPlaceholder: 'ಬೆಳೆ ಅಥವಾ ಜಿಲ್ಲೆ ಹುಡುಕಿ...',
      allCategories: 'ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು',
      listProduceBtn: 'ಉತ್ಪನ್ನ ಸೇರಿಸಿ',
      sampleDataBadge: 'ಡೆಮೊ ಡೇಟಾ (DEMO)',
      contactSeller: 'ಸಂಪರ್ಕಿಸಿ',
    },
    profile: {
      title: 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್ಸ್',
      farmerDetails: 'ರೈತರ ವಿವರಗಳು',
      buyerDetails: 'ಖರೀದಿದಾರರ ವಿವರಗಳು',
      businessName: 'ಸಂಸ್ಥೆಯ ಹೆಸರು',
      businessType: 'ವ್ಯಾಪಾರ ಪ್ರಕಾರ',
      mandiLocation: 'ಮಂಡಿ ಸ್ಥಳ',
      activeRole: 'ಸಕ್ರಿಯ ಖಾತೆಯ ಪಾತ್ರ',
      farmerAccount: 'ರೈತರ ಖಾತೆ',
      buyerAccount: 'ಖರೀದಿದಾರರ ಖಾತೆ',
      switchRoleBtn: 'ಪಾತ್ರವನ್ನು ಬದಲಾಯಿಸಿ',
      accountSecurity: 'ಖಾತೆ ಭದ್ರತೆ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್',
      changePasswordTitle: 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ',
      currentPasswordLabel: 'ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್',
      newPasswordLabel: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್',
      confirmNewPasswordLabel: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
      savePasswordBtn: 'ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಿ',
      signOutBtn: 'ಸೈನ್ ಔಟ್ ಮಾಡಿ',
      deleteAccountBtn: 'ಖಾತೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ',
      language: 'ಆ್ಯಪ್ ಭಾಷೆ',
      units: 'ಅಳತೆ ಮಾಪನಗಳು',
      storageInfo: 'ಡೇಟಾ ಭದ್ರತೆ',
      resetDemoData: 'ಡೇಟಾ ಮರುಹೊಂದಿಸಿ',
      exportBackup: 'ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ (JSON)',
      importBackup: 'ಬ್ಯಾಕಪ್ ಮರುಸ್ಥಾಪಿಸಿ (JSON)',
      loggedInAs: 'ಲಾಗಿನ್ ಆದ ಖಾತೆ:',
    },
  },
  gu: createLangDict({
    appName: 'AgriConnect',
    tagline: 'તપાસો. સમજો. ઉગાડો. કમાઓ.',
    subTagline: 'સ્માર્ટ ખેતી. વાજબી કમાણી.',
    tabs: {
      home: 'હોમ',
      myFarm: 'મારું ખેતર',
      soilScan: 'જમીન તપાસ',
      marketplace: 'બજાર',
      profileSettings: 'પ્રોફાઇલ અને સેટિંગ્સ',
    },
    home: {
      welcomeGreeting: 'નમસ્તે,',
      taglineHeading: 'તમારી ખેતી, હવે સ્માર્ટ.',
      overviewTitle: 'ખેતરની વિગત',
      activeCrops: 'ચાલુ પાક',
      totalLand: 'કુલ જમીન',
      soilHealth: 'જમીન રેકોર્ડ',
      cropHealth: 'પાકનું સ્વાસ્થ્ય',
      notAssessedYet: 'હજી ચકાસાયેલ નથી',
      quickActions: 'કૃષિ સાધનો',
      soilScanAction: 'સ્કેન (Scan)',
      soilScanDesc: 'પાનની ચકાસણી, જમીનનો પ્રકાર અને એઆઈ સલાહ',
      aiAdvisorAction: 'એઆઈ સલાહકાર',
      aiAdvisorDesc: 'કૃષિ નિષ્ણાત પાસેથી માર્ગદર્શન મેળવો',
      cropDoctorAction: 'પાક ડૉક્ટર',
      cropDoctorDesc: 'રોગના લક્ષણો નોંધીને નિવારણ જુઓ',
      fertilizerAction: 'ખાતર માર્ગદર્શન',
      fertilizerDesc: 'પાકના વિકાસ મુજબ ખાતરનું આયોજન',
      marketplaceAction: 'કૃષિ બજાર',
      marketplaceDesc: 'ઉત્પાદન વેચો અને ખરીદદારો શોધો',
      weatherTitle: 'હવામાન',
      weatherUnavailable: 'લાઇવ હવામાન સેવા જોડાયેલ નથી',
      weatherNotice: 'સ્ટેજ 1 ફ્રી વર્ઝન છે. સેટેલાઇટ હવામાન ટૂંક સમયમાં આવશે.',
      recentActivity: 'તાજેતરની વિગત',
    },
    myFarm: {
      title: 'મારું ખેતર',
      subtitle: 'ખેતર રેકોર્ડ અને પાક ચક્ર',
      editFarm: 'વિગત બદલો',
      addCrop: 'નવો પાક ઉમેરો',
      addObservation: 'નોંધ ઉમેરો',
      activeCropsTab: 'ચાલુ પાક',
      observationsTab: 'ખેતરની નોંધ',
      soilTestsTab: 'જમીન તપાસ રેકોર્ડ',
      emptyCropsTitle: 'કોઈ પાક નોંધાયેલ નથી',
      emptyCropsDesc: 'તમારા પાક ઉમેરીને વિકાસ તબક્કા ટ્રેક કરો.',
      growthStage: 'વિકાસ તબક્કો',
      sowingDate: 'વાવણી તારીખ',
      harvestEst: 'લણણી અંદાજ',
      diagnoseProblem: 'લક્ષણો તપાસો',
      fertilizerGuidance: 'ખાતર જરૂરિયાત',
    },
    soilScan: {
      title: 'જમીન તપાસ',
      tagline: 'વૈજ્ઞાનિક રીતે તમારી જમીન સમજો',
      scientificDisclaimer: 'સૂચના: માત્ર ફોટો દ્વારા pH કે નાઇટ્રોજન જાણી શકાતું નથી. લેબ ટેસ્ટ જરૂરી છે.',
      photoStep: '૧. જમીનનો ફોટો',
      photoInstruction: 'ખેતરની ઉપરની જમીનનો સ્પષ્ટ ફોટો પસંદ કરો.',
      contextStep: '૨. ખેતરનો સંદર્ભ',
      labStep: '૩. સોઇલ હેલ્થ કાર્ડ (વૈકલ્પિક)',
      submitScan: 'નોંધણી કરો',
      resultsSummary: 'જમીન અહેવાલ',
      statusUnavailableAI: 'ઓટોમેટિક AI હજી જોડાયેલ નથી.',
    },
    cropDoctor: {
      title: 'પાક ડૉક્ટર',
      subtitle: 'લક્ષણો તપાસો',
      notice: 'ઓટોમેટિક AI હજી જોડાયેલ નથી. દવા છાંટતા પહેલા KVK નો સંપર્ક કરો.',
      selectCrop: 'પાક પસંદ કરો',
      selectStage: 'તબક્કો',
      describeIssue: 'સમસ્યા વર્ણવો',
      photoOptional: 'ફોટો (વૈકલ્પિક)',
      submitProblem: 'યાદી જુઓ',
    },
    fertilizer: {
      title: 'ખાતર માર્ગદર્શન',
      subtitle: 'સંતુલિત ખાતરનો ઉપયોગ',
      notice: 'જમીન ચકાસણી મુજબ જ ખાતર વાપરો.',
      selectCrop: 'પાક',
      selectStage: 'તબક્કો',
      soilTestStatus: 'ચકાસણી સ્થિતિ',
      calculateGuidance: 'માર્ગદર્શન જુઓ',
    },
    marketplace: {
      title: 'કૃષિ બજાર',
      subtitle: 'ખેડૂત અને વેપારીઓનું પ્લેટફોર્મ',
      demoNotice: 'ડેમો ડેટા (Demonstration Data) — સાચા બજાર ભાવો ટૂંક સમયમાં આવશે.',
      searchPlaceholder: 'પાક અથવા જિલ્લો શોધો...',
      allCategories: 'તમામ પાક',
      listProduceBtn: 'ઉત્પાદન ઉમેરો',
      sampleDataBadge: 'ડેમો ડેટા (DEMO)',
      contactSeller: 'સંપર્ક કરો',
    },
    profile: {
      title: 'પ્રોફાઇલ અને સેટિંગ્સ',
      farmerDetails: 'ખેડૂત વિગતો',
      language: 'ભાષા',
      units: 'માપના એકમો',
      storageInfo: 'ડેટા સુરક્ષા',
      resetDemoData: 'ડેટા રીસેટ કરો',
      exportBackup: 'બેકઅપ ડાઉનલોડ (JSON)',
      importBackup: 'બેકઅપ રીસ્ટોર (JSON)',
    },
  }),
  bn: createLangDict({
    appName: 'AgriConnect',
    tagline: 'স্ক্যান করুন। বুঝুন। ফলান। আয় করুন।',
    subTagline: 'স্মার্ট কৃষি। ন্যায্য আয়।',
    tabs: {
      home: 'হোম',
      myFarm: 'আমার খামার',
      soilScan: 'মাটি পরীক্ষা',
      marketplace: 'কৃষি বাজার',
      profileSettings: 'প্রোফাইল ও সেটিংস',
    },
    home: {
      welcomeGreeting: 'স্বাগতম,',
      taglineHeading: 'আপনার চাষাবাদ, এবার আরও স্মার্ট।',
      overviewTitle: 'খামারের সারসংক্ষেপ',
      activeCrops: 'চলতি ফসল',
      totalLand: 'মোট জমি',
      soilHealth: 'মাটির রেকর্ড',
      cropHealth: 'ফসলের স্বাস্থ্য',
      notAssessedYet: 'এখনও মূল্যায়ন হয়নি',
      quickActions: 'কৃষি সেবা',
      soilScanAction: 'স্ক্যান (Scan)',
      soilScanDesc: 'পাতার পর্যবেক্ষণ, মাটির গঠন ও এআই পরামর্শ',
      aiAdvisorAction: 'এআই পরামর্শক',
      aiAdvisorDesc: 'কৃষি বিশেষজ্ঞের সাথে পরামর্শ করুন',
      cropDoctorAction: 'ফসল ডাক্তার',
      cropDoctorDesc: 'ফসলের রোগের লক্ষণ ও সমাধান দেখুন',
      fertilizerAction: 'সার নির্দেশিকা',
      fertilizerDesc: 'ফসলের বৃদ্ধি অনুযায়ী সুষম সার ব্যবস্থাপনা',
      marketplaceAction: 'কৃষি বাজার',
      marketplaceDesc: 'ফসল বিক্রি করুন ও ক্রেতাদের সাথে যুক্ত হন',
      weatherTitle: 'আবহাওয়া',
      weatherUnavailable: 'লাইভ আবহাওয়া সেবা এখনও যুক্ত হয়নি',
      weatherNotice: 'এটি প্রথম পর্যায়ের ফ্রি সংস্করণ। দ্রুত স্যাটেলাইট আবহাওয়া যুক্ত হবে।',
      recentActivity: 'সাম্প্রতিক তথ্য',
    },
    myFarm: {
      title: 'আমার খামার',
      subtitle: 'খামারের রেকর্ড ও ফসলের বৃদ্ধি',
      editFarm: 'তথ্য পরিবর্তন',
      addCrop: 'নতুন ফসল যোগ করুন',
      addObservation: 'পর্যবেক্ষণ লিখুন',
      activeCropsTab: 'চলতি ফসল',
      observationsTab: 'পর্যবেক্ষণসমূহ',
      soilTestsTab: 'মাটি পরীক্ষার তথ্য',
      emptyCropsTitle: 'কোনো ফসল যুক্ত নেই',
      emptyCropsDesc: 'আপনার ফসল যোগ করে বৃদ্ধির পর্যায়গুলো ট্র্যাক করুন।',
      growthStage: 'বৃদ্ধির পর্যায়',
      sowingDate: 'বপনের তারিখ',
      harvestEst: 'সম্ভাব্য কর্তন',
      diagnoseProblem: 'লক্ষণ পরীক্ষা',
      fertilizerGuidance: 'সারের চাহিদা',
    },
    soilScan: {
      title: 'মাটি পরীক্ষা',
      tagline: 'বিজ্ঞানসম্মতভাবে নিজের মাটি বুঝুন',
      scientificDisclaimer: 'বিজ্ঞপ্তি: শুধুমাত্র ছবি দিয়ে সঠিক pH বা নাইট্রোজেন জানা সম্ভব নয়। ল্যাব টেস্ট জরুরি।',
      photoStep: '১. মাটির ছবি',
      photoInstruction: 'উপরের মাটির পরিষ্কার ছবি নির্বাচন করুন।',
      contextStep: '২. খামারের প্রেক্ষাপট',
      labStep: '৩. মৃত্তিকা স্বাস্থ্য কার্ড (ঐচ্ছিক)',
      submitScan: 'রেকর্ড করুন',
      resultsSummary: 'মাটির রিপোর্ট',
      statusUnavailableAI: 'স্বয়ংক্রিয় AI এখনও যুক্ত হয়নি।',
    },
    cropDoctor: {
      title: 'ফসল ডাক্তার',
      subtitle: 'রোগের লক্ষণ দেখুন',
      notice: 'স্বয়ংক্রিয় AI এখনও সক্রিয় নয়। কীটনাশক ব্যবহারের পূর্বে কৃষি কর্মকর্তার পরামর্শ নিন।',
      selectCrop: 'ফসল নির্বাচন',
      selectStage: 'পর্যায়',
      describeIssue: 'সমস্যা লিখুন',
      photoOptional: 'ছবি (ঐচ্ছিক)',
      submitProblem: 'চেকলিস্ট দেখুন',
    },
    fertilizer: {
      title: 'সার নির্দেশিকা',
      subtitle: 'সুষম সার প্রয়োগ',
      notice: 'মাটি পরীক্ষার ভিত্তিতেই সার প্রয়োগ করুন।',
      selectCrop: 'ফসল',
      selectStage: 'পর্যায়',
      soilTestStatus: 'মাটি পরীক্ষার অবস্থা',
      calculateGuidance: 'পরামর্শ দেখুন',
    },
    marketplace: {
      title: 'কৃষি বাজার',
      subtitle: 'কৃষক ও পাইকারদের সরাসরি মাধ্যম',
      demoNotice: 'নমুনা বাজার তথ্য (Demonstration Data) — বাস্তব দরদাম শীঘ্রই আসবে।',
      searchPlaceholder: 'ফসল বা জেলা অনুসন্ধান...',
      allCategories: 'সব ফসল',
      listProduceBtn: 'আপনার ফসল তালিকাভুক্ত করুন',
      sampleDataBadge: 'ডেমো ডেটা (DEMO)',
      contactSeller: 'যোগাযোগ করুন',
    },
    profile: {
      title: 'প্রোফাইল ও সেটিংস',
      farmerDetails: 'কৃষকের তথ্য',
      language: 'অ্যাপের ভাষা',
      units: 'পরিমাপের একক',
      storageInfo: 'ডেটা সুরক্ষা',
      resetDemoData: 'ডেটা রিসেট',
      exportBackup: 'ব্যাকআপ ডাউনলোড (JSON)',
      importBackup: 'ব্যাকআপ রিস্টোর (JSON)',
    },
  }),
};
