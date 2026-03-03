'use client';

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/lib/types";
import { useCurrentUser, login, signup } from "@/hooks/use-auth";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.86 2.25-5.02 2.25-4.34 0-7.88-3.57-7.88-7.95s3.54-7.95 7.88-7.95c2.47 0 3.96.98 4.86 1.86l2.6-2.58C18.14 1.3 15.48 0 12.48 0 5.88 0 .5 5.34.5 12s5.38 12 11.98 12c6.92 0 11.52-4.8 11.52-11.72 0-.78-.08-1.54-.2-2.36h-21.8z"
      fillRule="nonzero"
      fill="currentColor"
    />
  </svg>
);

export default function LoginPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center gap-2 mb-6">
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-foreground">AttendSync</h1>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup">
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email to reset your password.",
      });
      return;
    }
    toast({
      variant: "destructive",
      title: "Not Implemented",
      description: "Password reset is not yet implemented.",
    });
  };

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="ml-auto h-auto p-0 text-sm"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("student");
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signup({
        name,
        email,
        password,
        role,
        registrationNumber: role === 'student' ? registrationNumber : undefined
      });

      toast({
        title: "Account Created",
        description: "You have been successfully signed up.",
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your information to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-signup">Email</Label>
              <Input
                id="email-signup"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Input
                id="password-signup"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {role === 'student' && (
              <div className="grid gap-2">
                <Label htmlFor="reg-num">Registration/ID Number</Label>
                <Input
                  id="reg-num"
                  placeholder="e.g. STU12345"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>I am a...</Label>
              <RadioGroup
                value={role}
                onValueChange={(value: UserRole) => setRole(value)}
                className="flex items-center space-x-4 pt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="font-normal">Admin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="faculty" id="faculty" />
                  <Label htmlFor="faculty" className="font-normal">Faculty</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="font-normal">Student</Label>
                </div>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
