// The English text is the i18n key, so these strings also live in lib/i18n/ru.ts and ar.ts.
// Shared by the terms dialog at sign-up and the /terms and /privacy pages.
export type LegalSection = { title: string; text: string }

export const LEGAL_UPDATED = "Last updated: November 2026"

export const TERMS: LegalSection[] = [
  { title: "1. About PocketList", text: "PocketList is an online marketplace for renting homes in Dubai. We connect property owners with tenants. PocketList is not a licensed real estate broker and is not a party to any tenancy. We provide a tenancy contract template and on-screen signing for owners and tenants; a contract signed here becomes valid only once it is registered on Ejari." },
  { title: "2. Eligibility", text: "You must be at least 18 years old to use PocketList. By registering you confirm you have the legal capacity to enter into these terms." },
  { title: "3. Owner responsibilities", text: "Owners are solely responsible for the accuracy of their listings. All property details, photos, prices, and availability must be truthful and up to date, and you must have the right to publish every photo you upload. To list a property you must provide your title deed and passport, and may provide your Emirates ID. Listings are published only after we review them. Misrepresentation may result in account suspension." },
  { title: "4. Tenant responsibilities", text: "Before a listing goes live, we carry out a basic check that the owner's title deed and passport match the details they entered. This check does not confirm every detail of a listing. Tenants are responsible for their own final checks before signing a contract or paying any money, and PocketList is not liable for any losses arising from tenancies agreed between users." },
  { title: "5. Prohibited use", text: "You may not post false, misleading, or duplicate listings; spam other users; attempt to circumvent the platform; or use PocketList for any unlawful purpose." },
  { title: "6. Account termination", text: "We reserve the right to suspend or terminate any account that violates these terms, without notice." },
  { title: "7. Limitation of liability", text: "PocketList is provided “as is”. We are not liable for any direct, indirect, or incidental damages arising from your use of the platform or any transactions between users." },
  { title: "8. Changes to terms", text: "We may update these terms at any time. Continued use of PocketList after changes constitutes acceptance of the updated terms." },
]

// {email} is filled with the support address.
export const PRIVACY: LegalSection[] = [
  { title: "1. Data we collect", text: "We collect your email address and name when you register, listing information and photos you submit, your title deed, passport and, if provided, Emirates ID, and which pages are visited, to improve the platform. Identity and ownership documents are stored encrypted, used only to verify that you own the property, never shown to other users, and deleted when you delete the listing or your account." },
  { title: "2. Analytics", text: "We count page visits with Umami, an open-source analytics tool that runs on our own server. It uses no cookies, does not record your screen and does not identify you. We also count when a contact is shown, an inquiry is sent or a support message is sent; these counts are linked to the listing, not to you." },
  { title: "3. How we use your data", text: "Your data is used only to run and improve PocketList: to send sign-in codes, show your listings and understand how the site is used. We do not sell your data to third parties." },
  { title: "4. Data storage", text: "Your account data and analytics are stored on our own server. Sign-in codes and notifications are sent by email through Resend." },
  { title: "5. Your rights", text: "You may request deletion of your account and associated data at any time by contacting us at {email}." },
  { title: "6. Contact", text: "For any privacy-related questions, please email {email}." },
]
