import type { SiteSettings } from "@/lib/settings-store";

interface Intent {
  priority?: number;
  patterns: RegExp[];
  responseKey?: string;
  resolver?: (message: string) => Promise<string>;
  action?: () => void;
}

export function createBellaEngine(
  setTheme: (t: string) => void,
  changeLanguage: (l: string) => void,
  settings: SiteSettings,
  user: { uid: string } | null,
  router: { push: (href: string) => void },
) {
  const intents: Intent[] = [
    // ── Settings: Theme ──
    {
      patterns: [
        /dark\s*mode/i,
        /turn.*dark/i,
        /switch.*dark/i,
        /enable.*dark/i,
        /make.*dark/i,
        /go\s*dark/i,
        /डार्क/i,
        /ಡಾರ್ಕ್/i,
        /డార్క్/i,
        /ഡാർക്ക്/i,
        /டார்க்/i,
      ],
      responseKey: "bella.dark_mode_done",
      action: () => setTheme("dark"),
    },
    {
      patterns: [
        /light\s*mode/i,
        /turn.*light/i,
        /switch.*light/i,
        /enable.*light/i,
        /make.*light/i,
        /go\s*light/i,
        /लाइट/i,
        /ಲೈಟ್/i,
        /లైట్/i,
        /ലൈറ്റ്/i,
        /லைட்/i,
      ],
      responseKey: "bella.light_mode_done",
      action: () => setTheme("light"),
    },
    {
      patterns: [
        /system\s*(mode|theme)/i,
        /auto\s*(mode|theme)/i,
        /default\s*theme/i,
      ],
      responseKey: "bella.system_mode_done",
      action: () => setTheme("system"),
    },
    // ── Settings: Website Control ──
    {
      patterns: [/open.*settings/i, /show.*settings/i, /go.*settings/i],
      resolver: async () => {
        settings.setSettingsOpen(true);
        return "I've opened the Quick Settings menu for you!";
      },
    },
    {
      patterns: [/close.*settings/i, /hide.*settings/i],
      resolver: async () => {
        settings.setSettingsOpen(false);
        return "I've closed the settings menu.";
      },
    },
    {
      patterns: [/compact\s*mode\s*on/i, /enable.*compact/i],
      resolver: async () => {
        settings.setCompactMode(true);
        return "Compact mode enabled! The layout is now tighter.";
      },
    },
    {
      patterns: [/compact\s*mode\s*off/i, /disable.*compact/i],
      resolver: async () => {
        settings.setCompactMode(false);
        return "Compact mode disabled! The layout is back to normal.";
      },
    },
    {
      patterns: [/high\s*contrast\s*on/i, /enable.*contrast/i],
      resolver: async () => {
        settings.setHighContrast(true);
        return "High contrast mode enabled! Text is now more readable.";
      },
    },
    {
      patterns: [/high\s*contrast\s*off/i, /disable.*contrast/i],
      resolver: async () => {
        settings.setHighContrast(false);
        return "High contrast mode disabled.";
      },
    },
    // ── Navigation Control ──
    {
      patterns: [/go.*home/i, /open.*home/i, /take.*home/i],
      resolver: async () => {
        router.push("/");
        return "Taking you to the homepage!";
      },
    },
    {
      patterns: [/go.*dashboard/i, /open.*dashboard/i, /my\s*profile/i],
      resolver: async () => {
        router.push("/dashboard");
        return "Opening your dashboard...";
      },
    },
    {
      patterns: [
        /go.*sell/i,
        /open.*sell/i,
        /i\s*want\s*to\s*sell/i,
        /register.*service/i,
      ],
      resolver: async () => {
        router.push("/sell");
        return "Opening the Register Service page. Let's list your property!";
      },
    },
    ...[
      ["houses", "/houses"],
      ["land", "/land"],
      ["pg", "/pg"],
      ["commercial", "/commercial"],
      ["vehicles", "/vehicles"],
      ["commodities", "/commodities"],
    ].map(([label, path]) => ({
      patterns: [
        new RegExp(
          `^(?:go(?: to)?|open|browse|navigate to) (?:the )?${label}\\b`,
          "i",
        ),
      ],
      resolver: async () => {
        router.push(path);
        return `Opening the ${label} section.`;
      },
    })),
    {
      patterns: [
        /go.*about/i,
        /open.*about/i,
        /tell.*about\s*us/i,
        /about\s*us/i,
      ],
      resolver: async () => {
        router.push("/about");
        return "Opening the About Us page. Let's learn more about BhoomiTayi!";
      },
    },
    {
      patterns: [/go.*contact/i, /open.*contact/i, /contact\s*us/i],
      resolver: async () => {
        router.push("/contact");
        return "Opening the Contact page. You can reach out to us directly there!";
      },
    },
    {
      patterns: [/go.*glossary/i, /open.*glossary/i, /jargon/i],
      resolver: async () => {
        router.push("/glossary");
        return "Opening the Real Estate Glossary page to help you understand common property terms.";
      },
    },
    {
      patterns: [/go.*privacy/i, /open.*privacy/i, /privacy\s*policy/i],
      resolver: async () => {
        router.push("/privacy");
        return "Opening the Privacy Policy page.";
      },
    },
    {
      patterns: [
        /go.*terms/i,
        /open.*terms/i,
        /terms\s*of\s*service/i,
        /terms\s*and\s*conditions/i,
      ],
      resolver: async () => {
        router.push("/terms");
        return "Opening the Terms of Service page.";
      },
    },
    {
      patterns: [/my\s*listings/i, /show\s*my\s*posts/i],
      resolver: async () =>
        user
          ? "Manage your listings, approval status and inquiries in [My dashboard](/dashboard)."
          : "Please [sign in](/auth/login) to view and manage your listings.",
    },
    {
      patterns: [
        /how\s*many.*listings/i,
        /total.*(properties|listings)/i,
        /website.*stats/i,
      ],
      resolver: async () =>
        "Choose a category to search current active listings: houses, land, PG, commercial, vehicles or commodities. I do not estimate platform totals.",
    },
    {
      patterns: [
        /reading\s*mode\s*off/i,
        /disable.*reading/i,
        /stop.*reading/i,
        /no.*reading/i,
        /exit.*reading/i,
      ],
      responseKey: "bella.reading_off",
      action: () => settings.setReadingMode(false),
    },
    {
      patterns: [
        /reading\s*mode\s*on/i,
        /turn.*reading/i,
        /enable.*reading/i,
        /start.*reading/i,
        /reading\s*mode/i,
      ],
      responseKey: "bella.reading_on",
      action: () => settings.setReadingMode(true),
    },
    // ── Settings: High Contrast ──
    {
      patterns: [
        /contrast\s*off/i,
        /disable.*contrast/i,
        /normal\s*contrast/i,
        /low\s*contrast/i,
      ],
      responseKey: "bella.contrast_off",
      action: () => settings.setHighContrast(false),
    },
    {
      patterns: [
        /high\s*contrast\s*on/i,
        /turn.*contrast/i,
        /enable.*contrast/i,
        /more\s*contrast/i,
        /high\s*contrast/i,
      ],
      responseKey: "bella.contrast_on",
      action: () => settings.setHighContrast(true),
    },
    // ── Settings: Font Size ──
    {
      patterns: [
        /font\s*(size)?\s*small/i,
        /smaller\s*(text|font)/i,
        /decrease.*font/i,
        /text\s*small/i,
      ],
      responseKey: "bella.font_small",
      action: () => settings.setFontSize("small"),
    },
    {
      patterns: [
        /font\s*(size)?\s*medium/i,
        /normal\s*(text|font|size)/i,
        /default\s*(text|font|size)/i,
        /reset.*font/i,
      ],
      responseKey: "bella.font_medium",
      action: () => settings.setFontSize("medium"),
    },
    {
      patterns: [
        /font\s*(size)?\s*large/i,
        /bigger\s*(text|font)/i,
        /increase.*font/i,
        /text\s*large/i,
        /large\s*text/i,
        /larger/i,
      ],
      responseKey: "bella.font_large",
      action: () => settings.setFontSize("large"),
    },
    {
      patterns: [
        /font\s*(size)?\s*(extra|x)\s*large/i,
        /biggest\s*(text|font)/i,
        /very\s*large/i,
        /xlarge/i,
        /extra\s*large/i,
      ],
      responseKey: "bella.font_xlarge",
      action: () => settings.setFontSize("xlarge"),
    },
    // ── Settings: Reduce Animations ──
    {
      patterns: [
        /reduce.*anim/i,
        /stop.*anim/i,
        /disable.*anim/i,
        /no.*anim/i,
        /less.*motion/i,
        /animation.*off/i,
      ],
      responseKey: "bella.animations_off",
      action: () => settings.setReduceAnimations(true),
    },
    {
      patterns: [
        /enable.*anim/i,
        /restore.*anim/i,
        /animation.*on/i,
        /more.*motion/i,
        /turn.*anim.*on/i,
      ],
      responseKey: "bella.animations_on",
      action: () => settings.setReduceAnimations(false),
    },
    // ── Settings: Compact Mode ──
    {
      patterns: [
        /compact.*off/i,
        /disable.*compact/i,
        /normal.*spacing/i,
        /spacious/i,
      ],
      responseKey: "bella.compact_off",
      action: () => settings.setCompactMode(false),
    },
    {
      patterns: [
        /compact\s*mode/i,
        /enable.*compact/i,
        /tight.*spacing/i,
        /compact.*on/i,
      ],
      responseKey: "bella.compact_on",
      action: () => settings.setCompactMode(true),
    },
    // ── Settings: Notifications ──
    {
      patterns: [
        /notification.*on/i,
        /enable.*notification/i,
        /email.*notification.*on/i,
      ],
      responseKey: "bella.notifications_on",
      action: () => settings.setEmailNotifications(true),
    },
    {
      patterns: [
        /notification.*off/i,
        /disable.*notification/i,
        /email.*notification.*off/i,
      ],
      responseKey: "bella.notifications_off",
      action: () => settings.setEmailNotifications(false),
    },
    {
      patterns: [/inquiry.*alert.*on/i, /enable.*inquiry/i],
      responseKey: "bella.inquiry_on",
      action: () => settings.setInquiryAlerts(true),
    },
    {
      patterns: [/inquiry.*alert.*off/i, /disable.*inquiry/i],
      responseKey: "bella.inquiry_off",
      action: () => settings.setInquiryAlerts(false),
    },
    {
      patterns: [/marketing.*on/i, /enable.*marketing/i],
      responseKey: "bella.marketing_on",
      action: () => settings.setMarketingEmails(true),
    },
    {
      patterns: [/marketing.*off/i, /disable.*marketing/i],
      responseKey: "bella.marketing_off",
      action: () => settings.setMarketingEmails(false),
    },
    // ── Settings: Language ──
    {
      patterns: [/english/i, /lang.*en/i, /switch.*english/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("en"),
    },
    {
      patterns: [/kannada/i, /kannad/i, /lang.*kn/i, /ಕನ್ನಡ/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("kn"),
    },
    {
      patterns: [/hindi/i, /lang.*hi/i, /हिंदी/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("hi"),
    },
    {
      patterns: [/telugu/i, /lang.*te/i, /తెలుగు/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("te"),
    },
    {
      patterns: [/malayalam/i, /lang.*ml/i, /മലയാളം/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("ml"),
    },
    {
      patterns: [/tamil/i, /lang.*ta/i, /தமிழ்/i],
      responseKey: "bella.lang_changed",
      action: () => changeLanguage("ta"),
    },
    // ── Settings: Reset ──
    {
      patterns: [
        /reset.*settings/i,
        /default.*settings/i,
        /restore.*defaults/i,
        /reset\s*all/i,
      ],
      responseKey: "bella.reset_done",
      action: () => {
        settings.resetAll();
        setTheme("system");
      },
    },
    // ── Settings: Smart Tools (Calculators) ──
    {
      patterns: [
        /open.*emi/i,
        /emi.*calc/i,
        /loan.*calc/i,
        /calculate.*emi/i,
        /mortgage.*calc/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("emi");
        return "I've opened the EMI Calculator for you! You can use it to calculate your monthly loan payments.";
      },
    },
    {
      patterns: [
        /open.*roi/i,
        /yield.*calc/i,
        /roi.*calc/i,
        /return.*calc/i,
        /calculate.*roi/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("roi");
        return "I've opened the ROI / Rental Yield Calculator for you. Let's see your investment returns!";
      },
    },
    {
      patterns: [
        /open.*stamp/i,
        /stamp.*duty/i,
        /registration.*calc/i,
        /calculate.*stamp/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("stamp");
        return "I've opened the Stamp Duty & Registration Calculator for you!";
      },
    },
    {
      patterns: [
        /open.*afford/i,
        /affordability/i,
        /how.*much.*can.*i.*afford/i,
        /budget.*calc/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("afford");
        return "I've opened the Affordability Calculator! Put in your income to see how much home you can afford.";
      },
    },
    {
      patterns: [
        /open.*area/i,
        /area.*convert/i,
        /land.*convert/i,
        /unit.*convert/i,
        /sqft.*to/i,
        /acres.*to/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("area");
        return "I've opened the Land Area Converter for you. You can convert between SqFt, Acres, Guntas, Cents, and Hectares!";
      },
    },
    {
      patterns: [/open.*scientific/i, /math.*calc/i, /scientific/i],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("scientific");
        return "I've opened the Scientific Calculator for you!";
      },
    },
    {
      patterns: [
        /open.*currency/i,
        /money.*convert/i,
        /exchange.*rate/i,
        /currency/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("currency");
        return "I've opened the Currency Converter! Note that these are estimated rates.";
      },
    },
    {
      patterns: [
        /open.*measure/i,
        /length/i,
        /distance/i,
        /meters.*to/i,
        /km.*to/i,
        /miles.*to/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("measure");
        return "I've opened the Length & Measurements Converter for you.";
      },
    },
    {
      patterns: [
        /open.*volume/i,
        /liters/i,
        /gallons/i,
        /liquid/i,
        /capacity/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("volume");
        return "I've opened the Volume Converter for you!";
      },
    },
    {
      patterns: [/open.*weight/i, /mass/i, /kg.*to/i, /lbs.*to/i, /pounds/i],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("weight");
        return "I've opened the Weight Converter for you!";
      },
    },
    {
      patterns: [
        /open.*temp/i,
        /celsius/i,
        /fahrenheit/i,
        /\bhot\b/i,
        /\bcold\b/i,
        /weather.*calc/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("temp");
        return "I've opened the Temperature Converter for you!";
      },
    },
    {
      patterns: [
        /open.*speed/i,
        /velocity/i,
        /mph.*to/i,
        /kmh.*to/i,
        /how.*fast/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("speed");
        return "I've opened the Speed Converter for you!";
      },
    },
    {
      patterns: [
        /open.*\btime\b/i,
        /duration/i,
        /hours.*to/i,
        /minutes.*to/i,
        /seconds/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("time");
        return "I've opened the Time Converter for you!";
      },
    },
    {
      patterns: [
        /open.*sip/i,
        /investment.*calc/i,
        /mutual.*fund/i,
        /sip.*calc/i,
        /return.*on.*investment/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("sip");
        return "I've opened the SIP Investment Calculator for you!";
      },
    },
    {
      patterns: [/open.*tax/i, /income.*tax/i, /deduction/i, /tax.*calc/i],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("tax");
        return "I've opened the Income Tax Calculator for you!";
      },
    },
    {
      patterns: [/open.*retire/i, /retirement/i, /corpus/i, /pension/i],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("retirement");
        return "I've opened the Retirement Planner for you!";
      },
    },
    {
      patterns: [
        /open.*margin/i,
        /\bprofit\b/i,
        /margin.*calc/i,
        /gross.*margin/i,
      ],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("margin");
        return "I've opened the Profit Margin Calculator for you!";
      },
    },
    {
      patterns: [/open.*discount/i, /sale.*price/i, /discount.*calc/i],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("discount");
        return "I've opened the Discount Calculator for you!";
      },
    },
    {
      patterns: [/open.*gst/i, /sales.*tax/i, /gst.*calc/i],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("gst");
        return "I've opened the GST / Sales Tax Calculator for you!";
      },
    },
    {
      patterns: [/open.*break.*even/i, /breakeven/i, /break-even/i],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("breakeven");
        return "I've opened the Break-even Calculator for you!";
      },
    },
    {
      patterns: [/open.*\bage\b/i, /how.*old/i, /age.*calc/i],
      priority: 2,
      resolver: async () => {
        settings.setActiveCalculator("age");
        return "I've opened the Age Calculator for you!";
      },
    },
    {
      priority: 3,
      patterns: [
        /date.*diff/i,
        /date.*duration/i,
        /how.*many.*days/i,
        /date.*calc/i,
      ],
      resolver: async () => {
        settings.setActiveCalculator("datediff");
        return "I've opened the Date Difference / Duration Calculator for you!";
      },
    },
    {
      patterns: [
        /open.*calculator/i,
        /show.*calculator/i,
        /all.*calculator/i,
        /smart.*tools/i,
        /business.*calc/i,
        /date.*calc/i,
      ],
      resolver: async () => {
        return "We have many calculators! Which one would you like?\n\nReal Estate & Finance:\n- EMI Calculator\n- ROI Calculator\n- Stamp Duty\n- Affordability\n- Land Area\n- SIP Investment\n- Income Tax\n- Retirement\n\nBusiness:\n- Profit Margin\n- Discount\n- GST / Sales Tax\n- Break-even\n\nDate & Time:\n- Age Calculator\n- Date Difference\n\nGeneral:\n- Scientific\n- Currency\n- Length\n- Volume\n- Weight\n- Temp\n- Speed\n- Time\n\nJust tell me which one!";
      },
    },
    // ── Settings: What can you control ──
    {
      patterns: [
        /what.*can.*control/i,
        /what.*settings/i,
        /what.*can.*change/i,
        /settings.*commands/i,
        /commands/i,
      ],
      responseKey: "_commands",
    },
    // ── Greetings ──
    {
      patterns: [
        /^hello/i,
        /^hey/i,
        /^good\s*(morning|afternoon|evening)/i,
        /^hi\b/i,
        /^hii/i,
        /^hola/i,
        /^namaste/i,
        /^namaskar/i,
      ],
      responseKey: "_greeting",
    },
    // ── About BhoomiTayi ──
    {
      patterns: [
        /what.*is.*bhoomitayi/i,
        /about.*bhoomitayi/i,
        /tell.*about.*bhoomitayi/i,
        /bhoomitayi.*kya/i,
        /ಭೂಮಿತಾಯಿ/i,
        /భూమితాయి/i,
        /ഭൂമിതായി/i,
        /பூமிதாயி/i,
        /भूमितायी/i,
      ],
      responseKey: "_about_bhoomitayi",
    },
    // ── BhoomiTayi Specific Details ──
    {
      patterns: [/founder/i, /who\s*founded/i, /who\s*owns/i, /ceo/i],
      responseKey: "_founder",
    },
    {
      patterns: [
        /list.*fee/i,
        /charge/i,
        /how\s*much.*(cost|list|fee)/i,
        /cost\s*to\s*list/i,
        /is\s*registration\s*free/i,
        /free\s*to\s*register/i,
      ],
      responseKey: "_pricing_fees",
    },
    {
      patterns: [
        /how.*contact/i,
        /support\s*email/i,
        /phone\s*number/i,
        /support\s*phone/i,
        /office\s*address/i,
        /where.*office/i,
        /help\b/i,
        /email\b/i,
        /reach\s*you/i,
      ],
      responseKey: "_contact_info",
    },
    // ── Social Media Channels ──
    {
      patterns: [
        /social(\s*media)?/i,
        /follow(\s*us)?/i,
        /socials/i,
        /instagram.*youtube/i,
        /channel.*page/i,
      ],
      responseKey: "_social_media",
    },
    {
      patterns: [/instagram/i, /insta\b/i, /ig\b/i],
      responseKey: "_instagram",
    },
    {
      patterns: [/youtube/i, /\byt\b/i, /video\s*channel/i, /youtube\s*link/i],
      responseKey: "_youtube",
    },
    {
      patterns: [/facebook/i, /\bfb\b/i, /facebook\s*page/i],
      responseKey: "_facebook",
    },

    // ── Glossary Jargon Answers ──
    {
      patterns: [/\b(a\s*khata|b\s*khata|khata)\b/i],
      responseKey: "_khata",
    },
    {
      patterns: [/\b(rtc|pahani)\b/i],
      responseKey: "_rtc",
    },
    {
      patterns: [/\b(ec|encumbrance)\b/i],
      responseKey: "_ec",
    },
    {
      patterns: [/carpet\s*area/i, /built-up\s*area/i, /super\s*built-up/i],
      responseKey: "_carpet_area",
    },
    {
      patterns: [/\bfsi\b/i, /floor\s*space\s*index/i],
      responseKey: "_fsi",
    },
    {
      patterns: [/na\s*land/i, /non-agricultural/i, /land\s*conversion/i],
      responseKey: "_na_land",
    },
    {
      patterns: [/mutation/i, /change\s*ownership/i],
      responseKey: "_mutation",
    },
    {
      patterns: [/guidance\s*value/i, /government\s*rate/i],
      responseKey: "_guidance_value",
    },
    // ── Property Help ──
    {
      patterns: [
        /house/i,
        /home/i,
        /flat/i,
        /apartment/i,
        /villa/i,
        /bhk/i,
        /मकान/i,
        /ಮನೆ/i,
        /ఇల్లు/i,
        /വീട്/i,
        /வீடு/i,
      ],
      responseKey: "_houses",
    },
    {
      patterns: [
        /\bland\b/i,
        /plot/i,
        /\bsites?\b/i,
        /acre/i,
        /ज़मीन/i,
        /ಭೂಮಿ/i,
        /భూమి/i,
        /ഭൂമി/i,
        /நிலம்/i,
      ],
      responseKey: "_land",
    },
    {
      patterns: [
        /\bpg\b/i,
        /paying\s*guest/i,
        /hostel/i,
        /room\s*(for|to)\s*rent/i,
      ],
      responseKey: "_pg",
    },
    {
      patterns: [/commercial/i, /office/i, /shop/i, /warehouse/i, /showroom/i],
      responseKey: "_commercial",
    },
    {
      patterns: [
        /vehicle/i,
        /\bcar(s)?\b/i,
        /bike/i,
        /scooter/i,
        /truck/i,
        /वाहन/i,
        /ವಾಹನ/i,
        /వాహన/i,
        /വാഹന/i,
        /வாகன/i,
      ],
      responseKey: "_vehicles",
    },
    // ── Tommy's Enhanced Knowledge ──
    {
      patterns: [
        /how.*list/i,
        /create.*listing/i,
        /post.*property/i,
        /steps.*sell/i,
      ],
      responseKey: "_list_guide",
    },
    {
      patterns: [/negotiat/i, /bargain/i, /closing.*deal/i, /offer/i],
      responseKey: "_negotiation",
    },
    {
      patterns: [
        /market.*analysis/i,
        /trends/i,
        /demand/i,
        /supply/i,
        /insight/i,
      ],
      responseKey: "_market",
    },
    {
      patterns: [/photography/i, /photo.*tips/i, /camera/i, /take.*pictures/i],
      responseKey: "_photography",
    },
    {
      patterns: [/timing/i, /when.*sell/i, /best.*time/i, /season/i],
      responseKey: "_timing",
    },
    {
      patterns: [/description/i, /write.*title/i, /compelling/i, /hook/i],
      responseKey: "_description_guide",
    },
    // ── Original Property Help ──
    {
      patterns: [/sell/i, /register.*service/i],
      responseKey: "_sell",
    },
    {
      patterns: [
        /price/i,
        /cost/i,
        /rate/i,
        /budget/i,
        /afford/i,
        /cheap/i,
        /expensive/i,
      ],
      responseKey: "_price",
    },
    {
      patterns: [/loan/i, /emi/i, /finance/i, /mortgage/i, /bank/i],
      responseKey: "_loan",
    },
    {
      patterns: [/document/i, /paper/i, /deed/i],
      responseKey: "_documents",
    },
    // ── Help & Capabilities ──
    {
      patterns: [
        /help/i,
        /what.*can.*(you.*)?do/i,
        /capabilities/i,
        /features/i,
        /what do you/i,
        /how.*use/i,
        /मदद/i,
        /ಸಹಾಯ/i,
        /ಸಹಾಯಂ/i,
        /உதவி/i,
      ],
      responseKey: "_what_can_do",
    },
    // ── Fun ──
    {
      patterns: [
        /thank/i,
        /thanks/i,
        /thx/i,
        /धन्यवाद/i,
        /ಧನ್ಯವಾದ/i,
        /ధన్యవాదాలు/i,
        /നന്ദി/i,
        /நன்றி/i,
      ],
      responseKey: "_thanks",
    },
    {
      patterns: [/bye/i, /goodbye/i, /see ya/i, /later/i],
      responseKey: "_bye",
    },
    {
      patterns: [/who.*are.*you/i, /your.*name/i, /about.*you/i],
      responseKey: "_about_bella",
    },
  ];

  const specific = new Set([
    "_list_guide",
    "_description_guide",
    "_photography",
    "_negotiation",
    "_documents",
    "_pricing_fees",
    "_what_can_do",
    "_about_bella",
    "bella.font_xlarge",
  ]);
  return intents.sort(
    (a, b) =>
      (b.priority || (specific.has(b.responseKey || "") ? 1 : 0)) -
      (a.priority || (specific.has(a.responseKey || "") ? 1 : 0)),
  );
}

// Static knowledge responses (these are long and stay English but can be extended)
const KNOWLEDGE_RESPONSES: Record<string, string> = {
  _commands:
    "I can control all these settings for you! Just say:\n\nSmart Tools: 'open emi calc', 'open roi calc', 'stamp duty', 'affordability', 'area converter', 'sip calc', 'tax calc', 'retirement calc'\n\nBusiness: 'profit margin', 'discount calc', 'gst calc', 'break even'\n\nDate/Time: 'age calc', 'date difference'\n\nGeneral Calcs: 'scientific', 'currency converter', 'volume', 'measurements', 'weight', 'temperature', 'speed', 'time'\n\nTheme: 'dark mode' / 'light mode' / 'system mode'\n\nDisplay: 'reading mode', 'high contrast', 'compact mode', 'reduce animations'\n\nFont: 'font small/medium/large/extra large'\n\nLanguage: 'English/Kannada/Hindi/Telugu/Malayalam/Tamil'\n\nNotifications: 'notification on/off'\n\nOther: 'reset settings'",
  _greeting:
    "Hello! I'm Bella, your BhoomiTayi assistant. Tell me what you are looking for, such as 'houses in Bangalore under 80 lakh'. I can also help draft a listing, open calculators or change website settings. What would you like to do?",
  _about_bhoomitayi:
    "BhoomiTayi is a marketplace for houses, land, PG accommodation, commercial spaces, vehicles and commodities. Browse listings, contact sellers and register your own service. Account registration is free; check Register Service for listing charges and approval requirements.",
  _houses:
    "Looking for a house? Here's how:\n\n1. Go to the Houses section from the menu\n2. Browse listings or use search to filter\n3. Click on a listing for full details & photos\n4. Hit 'Send Inquiry' to contact the seller\n\nKey things to check:\n- Location & neighborhood safety\n- Legal documents (Khata, EC, Sale Deed)\n- Water & electricity supply\n- Parking & amenities\n- Compare price per sq.ft with nearby properties",
  _land:
    "Land investment tips:\n\n1. Browse the Land section\n2. Check plot dimensions & total area\n3. Verify Khata type (A Khata is best)\n4. Visit the site in person\n5. Get EC (Encumbrance Certificate) verified\n\nImportant checks:\n- Clear title deed & ownership chain\n- No encumbrances or legal disputes\n- Proper road access\n- Zoning regulations\n- BBMP/BDA approval status",
  _pg: "PG hunting guide:\n\n1. Check the PG section for listings\n2. Filter by your preferred area & budget\n3. Compare amenities (food, WiFi, laundry)\n4. Visit and check the room condition\n5. Confirm rent, deposit & house rules\n\nPro tips:\n- Visit during meal times to check food quality\n- Ask about guest/visitor policies\n- Check water & power backup",
  _commercial:
    "Commercial space guide:\n\n1. Browse Commercial section\n2. Check carpet area vs super built-up\n3. Visit during business hours to check foot traffic\n4. Review lease terms carefully\n\nKey factors:\n- Parking availability\n- Power backup & internet\n- Fire safety & emergency exits\n- Proximity to public transport",
  _vehicles:
    "Vehicle buying guide:\n\n1. Browse the Vehicles section\n2. Check year, KMs driven & number of owners\n3. Verify RC, insurance & pollution certificate\n4. Request a test drive\n5. Negotiate price based on condition",
  _list_guide:
    "COMPLETE LISTING GUIDE - Quick & simple, just 3 steps!\n\nStep 1: Choose Category\n- Click 'Register Service' in the navbar or menu\n- Select your category: House, Land, PG, Commercial, Vehicle, or Commodity\n- Choose your action: Sell, Rent, or Lease\n\nStep 2: Fill Basic Details\n- Title: Short & clear (e.g., 'Spacious 3BHK in Koramangala')\n- Description: Describe features, condition, nearby landmarks\n- Address: Your location / area\n- Phone Number: Buyers will call this number\n- Email: For inquiries\n- Photos: Upload 1–4 high-quality photos\n\nStep 3: Review & Submit\n- Check all details in the preview\n- Submit — listing goes live after admin approval!",
  _negotiation:
    "NEGOTIATION PLAYBOOK:\n\n1. Preparation: Know your MINIMUM acceptable price.\n2. Preparation: Highlight 5 unique selling points.\n3. Handling Offers: Never accept the first offer immediately.\n4. Counter: Move in small increments (1-2% at a time).\n5. Closing: Get TOKEN ADVANCE (1-2% of price) immediately in writing.\n\nGolden Rule: Never show desperation. The right buyer will come!",
  _market:
    "I do not have live market trend data or completed sale prices. Compare current listings in your locality and ask a local professional for recent transaction evidence. I can help you search and compare asking prices.",
  _photography:
    "PHOTOGRAPHY GUIDE:\n\n1. Prepare: Deep clean every room and remove clutter.\n2. Lighting: Best time is 10 AM - 12 PM (bright natural light).\n3. Technique: Hold phone at chest height, keep it level.\n4. Quantity: Upload 8-10 photos. First shot should be the front exterior.",
  _timing:
    "BEST TIME TO SELL:\n\n- PEAK (Oct - Jan): Festival season, highest buyer activity.\n- GOOD (Jan - Mar): Financial year-end bonuses and tax planning.\n- SLOW (Jul - Sep): Monsoon season, fewer site visits.\n\nTip: List on Thursday/Friday as people browse most during weekends!",
  _description_guide:
    "WRITING THE PERFECT DESCRIPTION:\n\n1. Title: Under 60 chars. Include Type + Size + Location.\n2. Hook: Lead with your BEST feature (e.g., 'East-facing').\n3. Amenities: List parking, water, power backup clearly.\n4. Connectivity: Mention distance to nearest landmark/metro.",
  _sell:
    "How to sell on BhoomiTayi — it's now super simple!\n\n1. Click 'Register Service' in the navbar\n2. Choose your category (House/Land/PG/Commercial/Vehicle/Commodity)\n3. Fill in: Title, Description, Address, Phone, Email\n4. Upload 1–4 photos\n5. Review the preview and Submit!\n\nThat's it — no lengthy forms, just the essentials. Buyers will contact you directly via your phone or email.",
  _price:
    "Compare similar listings in the same locality, including area, condition and amenities. Ask the seller for the full cost breakdown. Use [Houses](/houses) or [Land](/land) to compare asking prices. Asking prices are not completed sale prices.",
  _loan:
    'I can open the EMI calculator to explore monthly payments using the loan amount, interest rate and tenure you enter. Ask your lender for current rates, eligibility and the full fee schedule. Say "EMI calculator" to get started.',
  _documents:
    "Essential property documents:\n\nFor Buying:\n- Sale Deed, Title Deed\n- EC - Encumbrance Certificate\n- Khata Certificate & Extract\n- Tax paid receipts\n- Building plan approval\n- Occupancy Certificate\n\nAlways get a lawyer to verify!",
  _help:
    "I'm Bella, your smarter real estate assistant!\n\nSelling Tips: 'listing guide', 'negotiation', 'market trends', 'photography', 'timing'\nProperty Help: houses, land, PG, commercial, vehicles, price guidance, documents\nSettings: 'dark/light mode', 'reading mode', 'font size', 'language', 'notifications'\n\nTry asking 'how to list' or 'what are the market trends'!",
  _what_can_do:
    "Here is a complete list of everything I can do for you:\n\n1. 🏠 FIND PROPERTIES & LISTINGS\n   - Ask me: 'show houses', 'plots in land', 'commercial spaces', or 'any PG available?'\n   - I will fetch real-time listings with titles, prices, locations, and clickable links!\n\n2. 📈 SMART CALCULATORS & TOOLS\n   - Ask me: 'EMI calculator', 'SIP calculator', 'Tax calculator', 'Scientific calculator', 'GST calculator', 'Margin calculator', 'Age calculator', or 'Currency converter'\n   - I will instantly open the tool right here in the chat!\n\n3. ⚙️ CONTROL WEBSITE SETTINGS\n   - Ask me: 'dark mode', 'light mode', 'increase font size', 'reading mode', or 'change language to Hindi/Kannada'\n   - I will apply the changes to the website instantly!\n\n4. 📝 WALKTHROUGHS & TIPS\n   - Ask me: 'how to list' (walkthrough), 'negotiation tips', 'photography guide', 'market trends', or 'best time to sell'",
  _thanks:
    "You're welcome! Happy to help. I'm always here if you need anything!",
  _bye: "Bye! Come back anytime. Happy property hunting!",
  _about_bella:
    "I am Bella, your BhoomiTayi assistant. I can search live listings, remember search filters during this session, compare your shortlist, help draft listing descriptions, open calculators and change website settings. My guided answers are not a general-purpose AI chat or live market valuation.",
  _founder:
    "For verified information about the BhoomiTayi team, visit [About Us](/about) or [Contact Us](/contact).",
  _pricing_fees:
    "Browsing and account registration are free. Listing charges and optional promotion charges are shown in [Register Service](/sell). Review the amount and approval requirements there before paying.",
  _contact_info:
    "For help and support, you can reach BhoomiTayi directly:\n\n📧 Email: [bhoomitayi7@gmail.com](mailto:bhoomitayi7@gmail.com)\n📞 Phone: [+91 6361843563](tel:+916361843563)\n📍 Office: Bangalore, Karnataka, India\n\nOfficial Social Media Channels:\n📸 Instagram: [Instagram @bhoomitayi7](https://www.instagram.com/bhoomitayi7)\n📺 YouTube: [YouTube @bhoomitayi7](https://youtube.com/@bhoomitayi7?si=KWM9l_VAawUDaNQb)\n📘 Facebook: [Facebook BhoomiTayi](https://www.facebook.com/share/19Ht8mJf4u/)\n\nYou can also visit our [Contact Us](/contact) page!",
  _social_media:
    "Connect with BhoomiTayi on all our official social media channels:\n\n📸 Instagram: [Instagram @bhoomitayi7](https://www.instagram.com/bhoomitayi7)\n📺 YouTube: [YouTube @bhoomitayi7](https://youtube.com/@bhoomitayi7?si=KWM9l_VAawUDaNQb)\n📘 Facebook: [Facebook BhoomiTayi](https://www.facebook.com/share/19Ht8mJf4u/)\n📧 Help & Support: [bhoomitayi7@gmail.com](mailto:bhoomitayi7@gmail.com)\n\nClick any link above to open and follow us for the latest real estate updates!",
  _instagram:
    "Follow our official Instagram for property highlights, virtual walkthroughs, and updates:\n\n📸 [Open Instagram @bhoomitayi7](https://www.instagram.com/bhoomitayi7)",
  _youtube:
    "Subscribe to our official YouTube channel for video tours, property guides, and insights:\n\n📺 [Open YouTube @bhoomitayi7](https://youtube.com/@bhoomitayi7?si=KWM9l_VAawUDaNQb)",
  _facebook:
    "Check out our official Facebook page for the latest announcements and listings:\n\n📘 [Open Facebook Page](https://www.facebook.com/share/19Ht8mJf4u/)",
  _khata:
    "Khata is a municipal property assessment record used for tax administration. A Khata or B Khata status alone does not establish clear title or confirm every approval. Check the property records, title and approvals with the relevant authority and a qualified professional.",
  _rtc: "RTC (Pahani) stands for Record of Rights, Tenancy, and Crops. It is a crucial land record in Karnataka containing details of land ownership, area, soil type, and crop history.",
  _ec: "An Encumbrance Certificate records registered transactions or encumbrances for the period searched. It does not by itself guarantee clear title or reveal every dispute or unregistered liability. Check it alongside title documents and professional verification.",
  _carpet_area:
    "Carpet Area vs Super Built-Up Area:\n\n- Carpet Area: The actual usable area within the inner walls of a house or apartment where one can lay a carpet.\n- Super Built-Up Area: The built-up area of the property plus a proportionate share of common areas like lobbies, staircases, lifts, and corridors.",
  _fsi: "FSI (Floor Space Index) is the ratio of the total built-up area of a building to the total area of the plot on which it stands. It determines how many floors/area you can build.",
  _na_land:
    "NA Land (Non-Agricultural Land) is land that has been legally converted from agricultural use to residential, commercial, or industrial use. It requires a conversion order from competent authorities.",
  _stamp_duty:
    "Stamp Duty is a tax levied by the state government on legal documents related to the transfer of property ownership. BhoomiTayi is free to register, but state transaction fees apply when finalizing real estate purchases.",
  _mutation:
    "Mutation is the process of updating or changing the title ownership details in local municipal revenue records after a property transaction is completed.",
  _guidance_value:
    "Guidance Value is the minimum value of a property set by the state government below which a property cannot be registered in the sub-registrar office.",
};

export async function matchIntent(
  message: string,
  intents: Intent[],
  t: (key: string) => string,
): Promise<{ response: string; action?: () => void }> {
  const trimmed = message.trim();

  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      if (pattern.test(trimmed)) {
        if (intent.resolver) {
          const resolved = await intent.resolver(trimmed);
          return { response: resolved, action: intent.action };
        }
        const key = intent.responseKey;
        if (key && key.startsWith("_")) {
          return {
            response: KNOWLEDGE_RESPONSES[key] || t("bella.fallback"),
            action: intent.action,
          };
        }
        return {
          response: key ? t(key) : t("bella.fallback"),
          action: intent.action,
        };
      }
    }
  }

  return { response: t("bella.fallback") };
}
