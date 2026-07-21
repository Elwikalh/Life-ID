import { SignIn } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <SignIn routing="hash" />
    </div>
  )
}
