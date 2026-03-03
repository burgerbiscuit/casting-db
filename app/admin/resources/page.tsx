'use client'
import { useState } from 'react'

const TEMPLATES = [
  { id: 'editorial', label: 'Editorial Confirmation', body: `Hi,

We are ready to confirm the below for this project.

[MODEL NAME]

[INCLUDE SPECS]
Photographer: 
Stylist: 
Date: 
Location: 

Please confirm receipt of this email. Thank you!` },
  { id: 'beauty', label: 'Beauty Campaign Confirmation', body: `Hi [AGENT NAME],

Happy to confirm you for the [PROJECT NAME] shoot!

[MODEL NAME]

[PROJECT NAME]
Date: [DATE]
Rate: $[RATE] + 20% agency fee
Usage: Full buyout, in perpetuity (non-negotiable).

WHERE:
[LOCATION]

NOTES:
No color contacts
Hair should be worn as it was at casting day
Please have models come with an absolutely clean/no makeup face

Please provide model's legal name for the releases.
Please let us know once this has been received. Thank you!` },
  { id: 'backup', label: 'Backup / Hold Email', body: `Hi,

Hope you are well!

As a contingency for the [PROJECT NAME], we would like to see if it would be possible for the below to hold [DATES]?

[MODEL NAME]

We will know by the morning of the shoot date if we can confirm or release.

Thank you! x` },
  { id: 'release-all', label: 'Release All Options', body: `Hi,

We can release all options holding for [PROJECT NAME].

Thank you!` },
  { id: 'release-specific', label: 'Release Specific Model', body: `Hi,

We can release [MODEL NAME] for [PROJECT / DAY].

Thank you!` },
  { id: 'invoicing', label: 'Invoicing Instructions', body: `Please see invoicing details below.

Please include the following in your invoice:
- Dates worked
- Day rate for each day
- W9

Save as a PDF and label as:
FIRST NAME LAST NAME JOB TITLE INVOICE [DATE e.g. 4.12.25]

Please send Venmo request to @tashatongpreecha

Thank you` },
]

const LINGO = [
  { term: 'Specs', def: 'Project details: ethnicities, ages, usage, etc.' },
  { term: 'Usage', def: 'Where images will live. E.g. "Full buyout, unlimited usage, all media, in perpetuity."' },
  { term: 'In Perpetuity', def: 'No time limit — brand can use images forever.' },
  { term: 'Rate', def: 'Payment / Compensation.' },
  { term: 'Option', def: "Holding a model's time so they don't get booked elsewhere." },
  { term: '1st Option', def: 'Model is holding for us — we can book right away. Book or release promptly.' },
  { term: '2nd Option', def: 'Another hold exists. If that falls through, they may be available for ours.' },
  { term: 'NA', def: 'Not Available.' },
  { term: 'Release', def: 'Let optioned models know they are free — their time is no longer needed.' },
  { term: 'Chase / Push', def: 'Following up about availability or a package.' },
  { term: 'Package Link', def: 'What agents send to present their models.' },
  { term: 'Street Scouting', def: 'Finding non-repped talent on social media or IRL.' },
]

export default function ResourcesPage() {
  const [active, setActive] = useState('editorial')
  const [copied, setCopied] = useState(false)
  const template = TEMPLATES.find(t => t.id === active)!

  const copy = () => {
    navigator.clipboard.writeText(template.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xs tracking-widest uppercase font-medium mb-8">Resources</h1>

      <section className="mb-12">
        <h2 className="text-xs tracking-widest uppercase text-neutral-400 mb-4">Email Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setActive(t.id); setCopied(false) }}
                className={"w-full text-left px-3 py-2 text-xs tracking-wide transition-colors " + (active === t.id ? 'bg-black text-white' : 'hover:bg-neutral-100')}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="md:col-span-3 relative">
            <pre className="bg-neutral-50 border border-neutral-200 p-4 text-xs leading-relaxed whitespace-pre-wrap font-sans text-neutral-700 min-h-48">
              {template.body}
            </pre>
            <button onClick={copy}
              className={"absolute top-3 right-3 text-[10px] tracking-widest uppercase px-3 py-1 border transition-colors " + (copied ? 'bg-black text-white border-black' : 'bg-white border-neutral-300 hover:border-black')}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-neutral-400 mb-4">Casting Lingo</h2>
        <div className="divide-y divide-neutral-100 border border-neutral-100">
          {LINGO.map(l => (
            <div key={l.term} className="grid grid-cols-3 px-4 py-3 gap-4">
              <p className="text-xs font-medium tracking-wide">{l.term}</p>
              <p className="col-span-2 text-xs text-neutral-600 leading-relaxed">{l.def}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
