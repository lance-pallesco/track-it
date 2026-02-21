import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Currency, notifications, and app preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
