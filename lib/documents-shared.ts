export const DOCUMENT_KINDS = ["TITLE_DEED", "PASSPORT", "EMIRATES_ID"] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]
