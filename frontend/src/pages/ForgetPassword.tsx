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
import { forgetPassword, login } from "@/http/api";
import useTokenStore from "@/store";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ForetPasswordPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const emailRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: forgetPassword,
    onSuccess: (response) => {
      console.log("Email Sent successfully", response);
      navigate("/auth/verify-otp", {
        state: { email: emailRef.current?.value }});
      toast({
        className:
          "text-black border-2 border-green-600 shadow-lg rounded-lg h-16",
        title: "Otp sent successfully to your email",
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Something went wrong";
      toast({
        variant: "destructive",
        title: msg ||  "Otp sending failed",
      });
    },
  });

  const handleForgetPassSubmit = () => {
    const email = emailRef.current?.value;

    // Basic validation
    if (!email) {
      return toast({
        variant: "destructive",
        description: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast({
        variant: "destructive",
        description: "Invalid email format",
      });
    }

    mutation.mutate({ email: email });
  };
  return (
    <section className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Forget Password</CardTitle>
          <CardDescription>
            Enter your email below to send otp to your mail. <br />
            {mutation.isError && (
              <span className="text-red-500 text-sm">
                {"Something went wrong"}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
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
          
        </CardContent>
        <CardFooter>
          <div className="w-full">
            <Button
              onClick={handleForgetPassSubmit}
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <LoaderCircle className="animate-spin" />}

              <span className="ml-2">Submit</span>
            </Button>

            <div className="mt-4 text-center text-sm">
              
              <Link to={"/auth/login"} className="underline">
                Back to Login
              </Link>
            </div>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
};

export default ForetPasswordPage;
