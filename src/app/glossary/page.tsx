import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real Estate Glossary | BhoomiTayi",
  description: "Understand common real estate terms, land records, and legal jargon used in Indian real estate.",
};

const terms = [
  { term: "Khata", def: "An account or document issued by the local municipality to a property owner for the assessment of property tax." },
  { term: "A Khata", def: "A valid Khata indicating the property has all necessary legal approvals and complies with building bylaws." },
  { term: "B Khata", def: "A temporary register for properties that are unauthorized or lack proper approvals, allowing the municipality to collect tax without granting full legal status." },
  { term: "RTC (Pahani)", def: "Record of Rights, Tenancy, and Crops. A crucial land record in Karnataka containing details of land ownership, area, and crop history." },
  { term: "Encumbrance Certificate (EC)", def: "A legal document that provides evidence that the property in question is free from any monetary or legal liabilities (like a mortgage or pending loan)." },
  { term: "Carpet Area", def: "The actual usable area within the walls of a house or apartment where one can lay a carpet." },
  { term: "Super Built-Up Area", def: "The built-up area of a property plus a proportionate share of common areas such as lobbies, staircases, and elevators." },
  { term: "FSI (Floor Space Index)", def: "The ratio of the total built-up area of a building to the total area of the plot on which it stands." },
  { term: "NA Land", def: "Non-Agricultural Land. Land that has been legally converted from agricultural use to residential, commercial, or industrial use." },
  { term: "Stamp Duty", def: "A tax levied by the state government on the legal recognition of documents related to the transfer of property ownership." },
  { term: "Mutation", def: "The process of updating or changing the title ownership details in local municipal revenue records." },
  { term: "Guidance Value", def: "The minimum value of a property set by the state government below which a property cannot be registered." }
];

export default function GlossaryPage() {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">Real Estate <span className="text-blue-600">Glossary</span></h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Confused by the jargon? Browse our comprehensive guide to real estate, legal, and local terminology to buy with confidence.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {terms.map((item, idx) => (
          <div key={idx} className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400">#</span> {item.term}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {item.def}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>This glossary is for informational purposes only. Always consult with a legal professional before signing property documents.</p>
      </div>
    </div>
  );
}
