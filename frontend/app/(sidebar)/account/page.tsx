"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  UserCircleIcon,
  LogOutIcon,
  SettingsIcon,
  BellRingIcon,
  ShieldAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

interface UserProfile {
  username: string
  email: string
  date_joined: string
}

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access")
      if (!token) return

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/me/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
        }
      } catch (error) {
        toast.error("Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const payload = {
      username: formData.get("username"),
      email: formData.get("email"),
    }

    try {
      const token = localStorage.getItem("access")
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/me/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      if (res.ok) {
        toast.success("Profile updated successfully!")
      } else {
        toast.error("Failed to update profile.")
      }
    } catch (error) {
      toast.error("Network error.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    // Clear all tokens and send them to the login page
    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
    window.location.href = "/login"
  }

  if (isLoading) {
    return (
      <div className="animate-pulse p-6 text-muted-foreground">
        Loading account details...
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="mb-2 flex items-center gap-3">
        <UserCircleIcon className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold md:text-3xl">Account Settings</h1>
      </div>

      <div className="grid gap-6">
        {/* --- PROFILE CARD --- */}
        <Card>
          <form onSubmit={handleUpdateProfile}>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and public email. Member since{" "}
                {profile?.date_joined}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid max-w-md gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  defaultValue={profile?.username}
                  required
                />
              </div>
              <div className="grid max-w-md gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={profile?.email}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* --- PREFERENCES CARD (UI Only for Demo) --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" /> Preferences
            </CardTitle>
            <CardDescription>
              Manage how the system interacts with you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for budget limits and goals.
                </p>
              </div>
              {/* Fake toggle button for visual completeness */}
              <Button
                variant="outline"
                size="sm"
                className="pointer-events-none border-primary/20 bg-primary/10 text-primary"
              >
                <BellRingIcon className="mr-2 h-4 w-4" /> Enabled
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* --- DANGER ZONE --- */}
        <Card className="border-red-500/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <ShieldAlertIcon className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription>
              Log out of your current session on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Log Out Securely
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
