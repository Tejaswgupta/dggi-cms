"use client";
import { useState } from "react";

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

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ColorRing } from "react-loader-spinner";
import { toast } from "react-toastify";
import { signinWithEmailPassword } from "../../../auth/index";

export default function LoginForm() {
  const [email, setemail] = useState<string>("");
  const [password, setpassword] = useState<string>("");
  const [request, setrequest] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlesubmit = async () => {
    setrequest(true);

    if (password.length === 0 || email.length === 0 || !validateEmail(email)) {
      const errorMessage =
        password.length === 0 ? "Enter Correct Password" : "Enter Correct Email";

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      setrequest(false);
      return;
    }

    try {
      const result = await signinWithEmailPassword({ email, password });

      if (result.error) {
        toast.error("Invalid Credentials", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
        setrequest(false);
      } else {
        localStorage.setItem("VotumUserDetails", JSON.stringify(result.data));
        const redirectTo = searchParams.get("redirectTo") || "/tasks";
        router.push(redirectTo);
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      setrequest(false);
    }
  };

  return (
    <div className="flex w-[100vw] flex-col h-[100vh]">
      <div className="w-[100%] min-h-[90vh] flex justify-center items-center">
        <Card className="mx-auto max-w-sm base:w-[94%] tv:w-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Welcome back! Login for a personalized experience and exclusive
              features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setemail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setpassword(e.target.value)}
                    placeholder="******"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full flex justify-center items-center gap-1"
                disabled={request}
                style={request === true ? { opacity: 0.67 } : { opacity: 1 }}
                onClick={handlesubmit}
              >
                <ColorRing
                  visible={request}
                  height="23"
                  width="23"
                  ariaLabel="color-ring-loading"
                  wrapperStyle={{}}
                  wrapperClass="color-ring-wrapper"
                  colors={["#fff", "#fff", "#fff", "#fff", "#fff"]}
                />
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
