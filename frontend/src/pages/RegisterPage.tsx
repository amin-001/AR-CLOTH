import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/http/api";
import useTokenStore from "@/store";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PasswordInput } from "@/components/ui/password-input";

const RegisterPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      console.log("Registration successful", response);
      navigate("/auth/login");
      toast({
        className:
          "text-black border-2 border-green-600 shadow-lg rounded-lg h-16",
        title: "Registration successful",
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Something went wrong";
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: msg,
      });
    },
  });

  const handleLoginSubmit = () => {
    const name = nameRef.current?.value;
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    // Basic validation
    if (!email || !password || !name) {
      return toast({
        variant: "destructive",
        title: "Registration failed",
        description: "Email, password, and name are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email format",
      });
    }
    // navigate("/dashboard");
    mutation.mutate({ name, email, password });
  };
  return (
    <section className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>
            Enter your email below to register for an account. <br />
            {mutation.isError && (
              <span className="text-red-500 text-sm">
                {"Something went wrong"}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              ref={nameRef}
              id="name"
              type=""
              placeholder="John Doe"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              ref={emailRef}
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              ref={passwordRef}
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full">
            <Button
              onClick={handleLoginSubmit}
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <LoaderCircle className="animate-spin" />}
              <span className="ml-2">Sign in</span>
            </Button>

            {/* <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link to={"/auth/register"} className="underline">
                Sign up
              </Link>
            </div> */}
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link to={"/auth/login"} className="underline">
                Log in
              </Link>
            </div>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
};

export default RegisterPage;
