import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdminSession } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { DeedCheck } from "@/lib/deed-shared"
import { reviewListing } from "./_actions"

export const metadata = { title: "Admin" }

const RESULT_STYLES: Record<DeedCheck["result"], { label: string; className: string }> = {
  match: { label: "Match", className: "text-green-600" },
  mismatch: { label: "Mismatch", className: "text-destructive font-medium" },
  check: { label: "Check", className: "text-amber-600" },
}

const DOCUMENT_LABELS: Record<string, string> = {
  TITLE_DEED: "Title deed",
  PASSPORT: "Passport",
  EMIRATES_ID: "Emirates ID",
}

function Fact({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between gap-3 border-b py-1 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "–"}</span>
    </div>
  )
}

export default async function ReviewsPage() {
  if (!(await isAdminSession())) redirect("/admin")

  const listings = await prisma.listing.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { updatedAt: "asc" },
    include: {
      review: true,
      documents: { select: { id: true, kind: true } },
      agent: {
        select: {
          name: true,
          email: true,
          phone: true,
          documents: { where: { kind: { not: "TITLE_DEED" } }, select: { id: true, kind: true } },
        },
      },
    },
  })

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main id="main" className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">Back to admin</Link>
          <h1 className="mt-2 text-2xl font-bold">Listings to review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The table compares the owner&apos;s entries with the text of the deed. It can&apos;t tell whether the deed is
            genuine, so open the file, check it with DLD, and compare the name with the passport by eye.
          </p>
        </div>

        {listings.length === 0 && (
          <p className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
            Nothing to review.
          </p>
        )}

        {listings.map((listing) => {
          const checks: DeedCheck[] = listing.review?.checks ? JSON.parse(listing.review.checks) : []
          const documents = [...listing.documents, ...listing.agent.documents]
          return (
            <section key={listing.id} className="space-y-4 rounded-xl border bg-card p-4">
              <div>
                <h2 className="font-semibold">{listing.projectName}</h2>
                <p className="text-sm text-muted-foreground">
                  {listing.agent.name} · {listing.agent.email} · {listing.agent.phone}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {documents.map((document) => (
                  <a key={document.id} href={`/admin/documents/${document.id}`} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">{DOCUMENT_LABELS[document.kind]}</Button>
                  </a>
                ))}
                <Link href={`/listings/${listing.id}`} target="_blank">
                  <Button variant="ghost" size="sm">Listing</Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-1.5 pr-3 font-medium">Field</th>
                      <th className="py-1.5 pr-3 font-medium">Owner entered</th>
                      <th className="py-1.5 pr-3 font-medium">Title deed</th>
                      <th className="py-1.5 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((check) => (
                      <tr key={check.key} className="border-b last:border-0">
                        <td className="py-1.5 pr-3 text-muted-foreground">{check.label}</td>
                        <td className="py-1.5 pr-3">{check.claimed}</td>
                        <td className="py-1.5 pr-3">{check.found}</td>
                        <td className={cn("py-1.5", RESULT_STYLES[check.result].className)}>
                          {RESULT_STYLES[check.result].label}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-x-6 sm:grid-cols-2">
                <Fact label="Asking price" value={listing.priceLabel} />
                <Fact label="Bedrooms" value={listing.bedrooms} />
                <Fact label="Bathrooms" value={listing.bathrooms} />
                <Fact label="Furnished" value={listing.furnished} />
                <Fact label="Unit view" value={listing.view} />
                <Fact label="Status" value={listing.occupancy} />
                <Fact label="Available from" value={listing.availableFrom?.toISOString().slice(0, 10)} />
                <Fact label="Number of cheques" value={listing.chequeCount} />
                <Fact label="Paid to developer" value={listing.review?.amountPaid} />
              </div>

              <form action={reviewListing} className="space-y-2">
                <input type="hidden" name="id" value={listing.id} />
                <Textarea
                  name="note"
                  className="min-h-16 resize-none text-sm"
                  placeholder="Reason, sent to the owner. Required to reject."
                />
                <div className="flex justify-end gap-2">
                  <Button type="submit" name="decision" value="reject" variant="outline">Reject</Button>
                  <Button type="submit" name="decision" value="approve">Approve and publish</Button>
                </div>
              </form>
            </section>
          )
        })}
      </main>
    </div>
  )
}
