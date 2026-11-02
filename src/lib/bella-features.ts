import type { CalculatorType } from "@/lib/settings-store";

export interface BellaFeature {
  label: string;
  prompt?: string;
  calculator?: Exclude<CalculatorType, null>;
  href?: string;
  action?:
    | "new"
    | "download"
    | "expand"
    | "copy"
    | "retry"
    | "clear-filters"
    | "clear-shortlist"
    | "close";
}
const commands = (items: [string, string][]): BellaFeature[] =>
  items.map(([label, prompt]) => ({ label, prompt }));

export const bellaFeatureGroups: { title: string; features: BellaFeature[] }[] =
  [
    {
      title: "Find & compare listings",
      features: commands([
        ["Houses & apartments", "Find houses"],
        ["Land & plots", "Find land"],
        ["PG & hostels", "Find PG"],
        ["Commercial spaces", "Find commercial"],
        ["Vehicles", "Find vehicles"],
        ["Commodities", "Find commodities"],
        ["Search by location", "Find houses in Bangalore"],
        ["Search by budget", "Find houses under 80 lakh"],
        ["Search by BHK", "Find 2 BHK houses"],
        ["Rent a home", "Find houses for rent"],
        ["Buy a home", "Find houses for sale"],
        ["Compare listings", "Compare listings"],
        ["Remove budget limit", "any budget"],
        ["Remove BHK filter", "any BHK"],
        ["Remove location filter", "any location"],
        ["Start a new search", "new search"],
        ["My listings", "my listings"],
      ]),
    },
    {
      title: "Listing & selling help",
      features: commands([
        ["Draft a listing", "Help me draft a listing"],
        ["Cancel a draft", "cancel draft"],
        ["How to list", "How to list my house"],
        ["Description tips", "Description tips"],
        ["Photography tips", "Photography tips"],
        ["Negotiation tips", "Negotiation tips"],
        ["Selling timing", "Best time to sell"],
        ["Market information", "Market trends"],
        ["Pricing guidance", "Price guidance"],
        ["Property documents", "Property documents"],
        ["House buying guide", "House buying guide"],
        ["Land buying guide", "Land buying guide"],
        ["PG hunting guide", "PG hunting guide"],
        ["Commercial space guide", "Commercial space guide"],
        ["Vehicle buying guide", "Vehicle buying guide"],
        ["Home loan guide", "Loan guide"],
      ]),
    },
    {
      title: "All calculators & converters",
      features: (
        [
          ["EMI calculator", "emi"],
          ["ROI & rental yield", "roi"],
          ["Stamp duty & registration", "stamp"],
          ["Affordability calculator", "afford"],
          ["Land area converter", "area"],
          ["Scientific calculator", "scientific"],
          ["Currency converter", "currency"],
          ["Length converter", "measure"],
          ["Volume converter", "volume"],
          ["Weight converter", "weight"],
          ["Temperature converter", "temp"],
          ["Speed converter", "speed"],
          ["Time converter", "time"],
          ["SIP calculator", "sip"],
          ["Income tax calculator", "tax"],
          ["Retirement planner", "retirement"],
          ["Profit margin calculator", "margin"],
          ["Discount calculator", "discount"],
          ["GST calculator", "gst"],
          ["Break-even calculator", "breakeven"],
          ["Age calculator", "age"],
          ["Date difference", "datediff"],
        ] satisfies [string, Exclude<CalculatorType, null>][]
      ).map(([label, calculator]) => ({ label, calculator })),
    },
    {
      title: "Appearance & accessibility",
      features: commands([
        ["Dark mode", "dark mode"],
        ["Light mode", "light mode"],
        ["System theme", "system mode"],
        ["Reading mode on", "reading mode on"],
        ["Reading mode off", "reading mode off"],
        ["High contrast on", "high contrast on"],
        ["High contrast off", "high contrast off"],
        ["Compact mode on", "compact mode on"],
        ["Compact mode off", "compact mode off"],
        ["Reduce animations", "reduce animations"],
        ["Enable animations", "enable animations"],
        ["Small text", "font small"],
        ["Medium text", "font medium"],
        ["Large text", "font large"],
        ["Extra large text", "font extra large"],
        ["Open settings", "open settings"],
        ["Close settings", "close settings"],
        ["Reset website settings", "reset settings"],
      ]),
    },
    {
      title: "Website languages",
      features: commands([
        ["English", "English"],
        ["Kannada", "Kannada"],
        ["Hindi", "Hindi"],
        ["Telugu", "Telugu"],
        ["Malayalam", "Malayalam"],
        ["Tamil", "Tamil"],
      ]),
    },
    {
      title: "Notification preferences",
      features: commands([
        ["Email notifications on", "notification on"],
        ["Email notifications off", "notification off"],
        ["Inquiry alerts on", "inquiry alerts on"],
        ["Inquiry alerts off", "inquiry alerts off"],
        ["Marketing emails on", "marketing on"],
        ["Marketing emails off", "marketing off"],
      ]),
    },
    {
      title: "Property glossary",
      features: commands([
        ["A Khata & B Khata", "What is Khata?"],
        ["RTC / Pahani", "What is RTC?"],
        ["Encumbrance certificate", "What is EC?"],
        ["Carpet & built-up area", "What is carpet area?"],
        ["Floor Space Index", "What is FSI?"],
        ["Non-agricultural land", "What is NA land?"],
        ["Mutation", "What is mutation?"],
        ["Guidance value", "What is guidance value?"],
      ]),
    },
    {
      title: "BhoomiTayi & support",
      features: commands([
        ["About BhoomiTayi", "What is BhoomiTayi?"],
        ["About Bella", "Who are you?"],
        ["Team information", "Who founded BhoomiTayi?"],
        ["Listing fees", "How much to list?"],
        ["Contact support", "How to contact support?"],
        ["Social channels", "Social media"],
        ["Instagram", "Instagram"],
        ["YouTube", "YouTube"],
        ["Facebook", "Facebook"],
        ["All chat commands", "settings commands"],
      ]),
    },
    {
      title: "Go to a page",
      features: [
        ["Home", "/"],
        ["Houses", "/houses"],
        ["Land", "/land"],
        ["PG", "/pg"],
        ["Commercial", "/commercial"],
        ["Vehicles marketplace", "/vehicles"],
        ["Commodities marketplace", "/commodities"],
        ["Register Service", "/sell"],
        ["Dashboard", "/dashboard"],
        ["Manage my listings", "/dashboard/my-listings"],
        ["My favorites", "/dashboard/favorites"],
        ["My profile", "/dashboard/profile"],
        ["Sign in", "/auth/login"],
        ["About us", "/about"],
        ["Contact us", "/contact"],
        ["Glossary", "/glossary"],
        ["Privacy policy", "/privacy"],
        ["Terms of service", "/terms"],
      ].map(([label, href]) => ({ label, href })),
    },
    {
      title: "Conversation tools",
      features: [
        { label: "New conversation", action: "new" },
        { label: "Download conversation", action: "download" },
        { label: "Expand / compact chat", action: "expand" },
        { label: "Copy latest reply", action: "copy" },
        { label: "Retry last request", action: "retry" },
        { label: "Clear search filters", action: "clear-filters" },
        { label: "Clear comparison shortlist", action: "clear-shortlist" },
        { label: "Close Bella", action: "close" },
      ],
    },
  ];
export const bellaFeatureCount = bellaFeatureGroups.reduce(
  (total, group) => total + group.features.length,
  0,
);
