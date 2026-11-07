// The English text is the i18n key, so these strings also live in lib/i18n/ru.ts and ar.ts.
// Shared by the terms dialog at sign-up and the /terms and /privacy pages.
export type LegalSection = { title: string; text: string }

export const LEGAL_UPDATED = "Last updated: November 2026"

export const TERMS: LegalSection[] = [
  { title: "1. About PocketList", text: "PocketList is an online marketplace for Dubai real estate listings. We connect property owners with prospective buyers. PocketList is not a licensed real estate broker and does not participate in any transactions." },
  { title: "2. Eligibility", text: "You must be at least 18 years old to use PocketList. By registering you confirm you have the legal capacity to enter into these terms." },
  { title: "3. Owner Responsibilities", text: "Owners are solely responsible for the accuracy of their listings. All property details, photos, prices, and availability must be truthful and up to date, and you must have the right to publish every photo you upload. To list a property you must provide your title deed and passport, and may provide your Emirates ID. Listings are published only after we review them. Misrepresentation may result in account suspension." },
  { title: "4. Buyer Responsibilities", text: "Buyers are responsible for conducting their own due diligence before entering into any property transaction. PocketList does not verify listing accuracy and is not liable for any losses arising from transactions." },
  { title: "5. Prohibited Use", text: "You may not post false, misleading, or duplicate listings; spam other users; attempt to circumvent the platform; or use PocketList for any unlawful purpose." },
  { title: "6. Account Termination", text: "We reserve the right to suspend or terminate any account that violates these terms, without notice." },
  { title: "7. Limitation of Liability", text: "PocketList is provided \"as is\". We are not liable for any direct, indirect, or incidental damages arising from your use of the platform or any transactions between users." },
  { title: "8. Changes to Terms", text: "We may update these terms at any time. Continued use of PocketList after changes constitutes acceptance of the updated terms." },
]

// {email} is filled with the support address.
export const PRIVACY: LegalSection[] = [
  { title: "1. Data We Collect", text: "We collect your email address and name when you register, listing information and photos you submit, your title deed, passport and, if provided, Emirates ID, and usage data (pages visited, clicks, session behaviour) to improve the platform. Identity and ownership documents are stored encrypted, used only to verify that you own the property, never shown to other users, and deleted when you delete the listing or your account." },
  { title: "2. Analytics & Session Recording", text: "We use PostHog to collect anonymous analytics, including page views and user interactions. This may include session recordings, which replay how you move through the site. All form inputs, such as passwords and emails, are masked and never recorded. No cookies are used for tracking." },
  { title: "3. How We Use Your Data", text: "Your data is used only to run and improve PocketList: to send sign-in codes, show your listings and understand how the site is used. We do not sell your data to third parties." },
  { title: "4. Data Storage", text: "Your account data is stored on secure servers in the EU/US. Analytics data is processed by PostHog on EU-based servers." },
  { title: "5. Your Rights", text: "You may request deletion of your account and associated data at any time by contacting us at {email}." },
  { title: "6. Contact", text: "For any privacy-related questions, please email {email}." },
]
