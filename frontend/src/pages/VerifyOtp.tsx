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
import {  verifyOtp } from "@/http/api";
import { PasswordInput } from "@/components/ui/password-input";
import useTokenStore from "@/store";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const VerifyOtpPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const setToken = useTokenStore((state) => state.setToken);

  const email = location.state?.email;
  const otpRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (response) => {
      // setToken(response.data.token);
      navigate("/auth/login");
      toast({
        className:
          "text-black border-2 border-green-600 shadow-lg rounded-lg h-16",
        title: "Password reset successful",
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Something went wrong";
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: msg || "Invalid OTP or password does not match",
      });
    },
  });

  const handleLoginSubmit = () => {
    const otp = otpRef.current?.value;
    const newPassword = newPasswordRef.current?.value;
    const confirmPassword = confirmPasswordRef.current?.value;

    // Basic validation
    if (!otp || !newPassword || !confirmPassword) {
      return toast({
        variant: "destructive",
        description: "Otp and new password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return toast({
        variant: "destructive",
        description: "New password and confirm password do not match",
      });
    }

    const otpRegex = /^[0-9]{6}$/; 
    if (!otpRegex.test(otp)) {
      return toast({
        variant: "destructive",
        description: "Invalid OTP format",
      });
    }

    mutation.mutate({ email: email, otp: otp, newPassword: newPassword, confirmPassword: confirmPassword });
  };
  return (
    <section className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Otp</CardTitle>
          <CardDescription>
            Enter otp below, sent to your mail  <br />
            {mutation.isError && (
              <span className="text-red-500 text-sm">
                {"Something went wrong"}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="otp">Otp</Label>
            <Input
              ref={otpRef}
              id="otp"
              placeholder="123456"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput 
              ref={newPasswordRef} 
              id="newPassword" 
              placeholder="Enter new password"
              required 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput 
              ref={confirmPasswordRef} 
              id="confirmPassword" 
              placeholder="Confirm new password"
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

export default VerifyOtpPage;
