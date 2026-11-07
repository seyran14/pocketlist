export type GuideRole = "owner" | "tenant"
export type GuideStep = { title: string; text: string }

// English text is the i18n key, so these strings also live in lib/i18n/ru.ts and ar.ts.
export const GUIDE: Record<GuideRole, GuideStep[]> = {
  owner: [
    { title: "Create an owner account", text: "Choose “Property owner” and enter your email. You sign in with a 6-digit code we send there, so you never set a password." },
    { title: "Add your listing", text: "Open the menu and choose “Add listing”. Fill in the details and the rent, and add up to 12 photos. You can have up to 10 listings." },
    { title: "Prove that you own it", text: "Upload your title deed and your passport, and add your name and phone. The files are encrypted and only our review team opens them." },
    { title: "Wait for the review", text: "A person on our team checks every listing and emails you when it goes live, or tells you what to change first. Each listing stays up for 30 days." },
    { title: "Talk to tenants", text: "Tenants see your contact details and reach you directly, and you agree the terms with them yourself." },
    { title: "Prepare the contract", text: "In your dashboard, open the contract for the listing, fill it in and enter the tenant's email. We send them a link to sign." },
    { title: "You sign last", text: "The tenant adds their details and signs first. We then email you to check the details and add your signature." },
    { title: "Register on Ejari", text: "You both get the finished contract by email. It takes effect once it's registered on Ejari." },
  ],
  tenant: [
    { title: "Browse homes", text: "Search by building or area and filter by type, bedrooms and rent. Browsing works without an account." },
    { title: "Create a tenant account", text: "Choose “Looking to rent” and enter your email. You sign in with a 6-digit code we send there, so you never set a password." },
    { title: "Save what you like", text: "Tap the heart on a listing. Your saved homes are in the menu under “Saved”." },
    { title: "Contact the owner", text: "Open a listing and ask for the owner's contact details. You talk to the owner directly and agree the terms together." },
    { title: "Sign the contract", text: "The owner prepares the contract and we email you a link. Read it, add your details and your Emirates ID or passport number, and sign on screen." },
    { title: "Get the finished contract", text: "The owner signs after you, and we email you the finished contract. It takes effect once it's registered on Ejari." },
  ],
}
