"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type User = {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
  _count: { listings: number }
}

export function AdminUsersTable({ users }: { users: User[] }) {
  const [list, setList] = useState(users)
  const [loading, setLoading] = useState<string | null>(null)

  async function changeRole(id: string, role: "BUYER" | "AGENT") {
    setLoading(id + role)
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    })
    if (res.ok) {
      setList((prev) => prev.map((u) => u.id === id ? { ...u, role } : u))
      toast.success("Role updated")
    } else {
      toast.error("Failed to update role")
    }
    setLoading(null)
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete user ${email}?`)) return
    setLoading(id + "del")
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setList((prev) => prev.filter((u) => u.id !== id))
      toast.success("User deleted")
    } else {
      toast.error("Failed to delete user")
    }
    setLoading(null)
  }

  return (
    <div className="card-animate rounded-xl border bg-card overflow-hidden mt-6">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Users ({list.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Listings</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Joined</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {list.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2 font-medium truncate max-w-[180px]">{user.email}</td>
                <td className="px-4 py-2 text-muted-foreground">{user.name ?? "—"}</td>
                <td className="px-4 py-2">
                  <Badge variant={user.role === "AGENT" ? "default" : "secondary"} className="text-xs">
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{user._count.listings}</td>
                <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    {user.role === "BUYER" ? (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs px-2"
                        disabled={loading === user.id + "AGENT"}
                        onClick={() => changeRole(user.id, "AGENT")}
                      >
                        → Agent
                      </Button>
                    ) : (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs px-2"
                        disabled={loading === user.id + "BUYER"}
                        onClick={() => changeRole(user.id, "BUYER")}
                      >
                        → Buyer
                      </Button>
                    )}
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                      disabled={loading === user.id + "del"}
                      onClick={() => deleteUser(user.id, user.email)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No users</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
