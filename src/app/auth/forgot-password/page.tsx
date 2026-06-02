"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "react-toastify";
import { resetPasswordForEmail } from "@/auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter your email address.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await resetPasswordForEmail(trimmedEmail);
      if (!result.success) {
        throw new Error(result.error || "Failed to send reset email.");
      }

      setEmailSent(true);
      toast.success("Password reset link sent. Check your inbox.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset email.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-[100vw] flex-col h-[100vh]">
      <div className="w-[100%] min-h-[90vh] flex justify-center items-center">
        <Card className="mx-auto max-w-sm base:w-[94%] tv:w-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              {emailSent
                ? "We've sent a reset link to your email."
                : "Enter your email to receive a password reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="grid gap-4 text-sm text-muted-foreground">
                <p>Check your inbox (and spam folder) for the reset link.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                >
                  Send another link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            )}
            <div className="mt-4 text-center text-sm">
              <Link href="/auth/signin" className="underline">
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
