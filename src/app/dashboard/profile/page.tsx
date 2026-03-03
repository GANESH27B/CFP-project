"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useStorage } from "@/firebase";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { useCurrentUser } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { loadFaceApiModels, getFaceEmbedding } from "@/lib/face-api";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).optional(),
  email: z.string().email(),
  photo: z.instanceof(File).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
  if (data.newPassword || data.confirmPassword || data.currentPassword) {
    return !!data.currentPassword && !!data.newPassword && !!data.confirmPassword;
  }
  return true;
}, {
  message: "To change your password, you must provide your current password, a new password, and confirm it.",
  path: ["currentPassword"],
}).refine(data => {
  if (data.newPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});


type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const auth = useAuth();
  const storage = useStorage();
  const { user: mongoUser, loading: mongoLoading } = useCurrentUser();
  const { user: firebaseUser } = useUser();
  const [isPending, setIsPending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: mongoUser?.name || "",
      email: mongoUser?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange"
  });

  useEffect(() => {
    if (mongoUser) {
      form.reset({
        name: mongoUser.name || "",
        email: mongoUser.email || "",
      });
      setPreviewImage(mongoUser.avatarUrl || null);
    }
  }, [mongoUser, form]);


  const onSubmit = async (data: ProfileFormValues) => {
    if (!mongoUser || !auth || !storage || !firebaseUser) {
      toast({ variant: "destructive", title: "Error", description: "User not logged in or Firebase not initialized." });
      return;
    }
    setIsPending(true);

    let profileUpdated = false;
    let passwordUpdated = false;

    try {
      let newAvatarUrl: string | null = null;
      // Handle photo upload
      if (data.photo) {
        const file = data.photo;
        const storageRef = ref(storage, `avatars/${firebaseUser.uid}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        newAvatarUrl = await getDownloadURL(snapshot.ref);
        setPreviewImage(newAvatarUrl); // Update preview immediately
        profileUpdated = true;
      }

      // Collect updates
      const profileUpdates: { displayName?: string; photoURL?: string } = {};
      const firestoreUpdates: { name?: string; avatarUrl?: string } = {};

      if (data.name && mongoUser.name !== data.name) {
        profileUpdates.displayName = data.name;
        firestoreUpdates.name = data.name;
        profileUpdated = true;
      }

      if (newAvatarUrl) {
        profileUpdates.photoURL = newAvatarUrl;
        firestoreUpdates.avatarUrl = newAvatarUrl;
      }

      if (profileUpdated) {
        if (firebaseUser && profileUpdates.displayName) {
          await updateProfile(firebaseUser, profileUpdates);
        }

        const response = await fetch(`/api/users/${mongoUser?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(firestoreUpdates),
        });

        if (!response.ok) {
          throw new Error("Failed to update profile in database");
        }
      }

      // Update password if a new one is provided
      if (data.newPassword && data.currentPassword) {
        if (!firebaseUser.email) {
          toast({ variant: "destructive", title: "Update Failed", description: "Cannot change password without a user email." });
          setIsPending(false);
          return;
        }
        const credential = EmailAuthProvider.credential(firebaseUser.email, data.currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, data.newPassword);
        passwordUpdated = true;
      }

      if (profileUpdated || passwordUpdated) {
        toast({
          title: "Profile Updated",
          description: "Your information has been successfully updated.",
        });
      } else {
        toast({
          title: "No Changes",
          description: "You haven't made any changes to your profile.",
        });
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsPending(false);
      form.reset({
        ...form.getValues(),
        name: data.name, // Keep the new name in the form
        photo: undefined, // Clear the file input
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  };

  const getFallback = () => {
    if (mongoUser?.name) return mongoUser.name.substring(0, 2).toUpperCase();
    if (mongoUser?.email) return mongoUser.email.substring(0, 2).toUpperCase();
    return "AU";
  }

  if (mongoLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Manage your personal information and password.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Photo</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={previewImage || undefined} alt="User avatar" />
                            <AvatarFallback>{getFallback()}</AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              field.onChange(file);
                              setPreviewImage(URL.createObjectURL(file));
                            }
                          }}
                        />
                        <FormDescription>
                          Click the avatar to upload a new photo.
                        </FormDescription>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Your email" {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Email address cannot be changed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mongoUser?.role === 'student' && (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input value={mongoUser.registrationNumber || "Not Assigned"} disabled className="bg-muted" />
                  </FormControl>
                  <FormDescription>
                    Your unique student identifier. Contact admin to change.
                  </FormDescription>
                </FormItem>
              )}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Change Password</h3>
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <FaceBiometrics enrolled={!!mongoUser?.faceDescriptor} />
    </div>
  );
}

function FaceBiometrics({ enrolled }: { enrolled: boolean }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await loadFaceApiModels();
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models:", err);
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    if (!modelsLoaded) {
      toast({ title: "Loading AI Models", description: "Please wait while we initialize the biometric system." });
      return;
    }
    try {
      setStreaming(true);
      setIsRegistering(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({ variant: "destructive", title: "Camera Error", description: "Could not access your camera." });
      setStreaming(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    setIsRegistering(false);
  };

  const captureAndEnroll = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    setLoading(true);
    try {
      const video = videoRef.current;

      // Extract numeric embedding using ML model
      const descriptor = await getFaceEmbedding(video);

      if (!descriptor) {
        throw new Error("No face detected. Please ensure your face is clear and visible.");
      }

      const response = await fetch('/api/users/enroll-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enroll face.");
      }

      toast({ title: "Face Registered", description: "Your biometric profile has been updated successfully." });
      stopCamera();
      window.location.reload();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Enrollment Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="text-primary" />
              Face Biometrics
            </CardTitle>
            <CardDescription>Enroll your face for quick biometric attendance.</CardDescription>
          </div>
          <Badge variant={enrolled ? "default" : "secondary"}>
            {enrolled ? "Enrolled" : "Not Enrolled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isRegistering ? (
          <div className="relative w-full max-w-sm aspect-square bg-muted rounded-full overflow-hidden border-4 border-primary/30">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute inset-0 border-[40px] border-background/20 rounded-full pointer-events-none"></div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30">
            <Camera className="h-10 w-10 text-primary opacity-50" />
          </div>
        )}

        <p className="text-sm text-center text-muted-foreground mx-auto max-w-xs">
          {enrolled
            ? "Your facial profile is already registered. You can re-enroll if you want to update it."
            : "Registering your face allows you to be identified automatically during attendance sessions."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center gap-2">
        {isRegistering ? (
          <>
            <Button variant="outline" onClick={stopCamera} disabled={loading}>Cancel</Button>
            <Button onClick={captureAndEnroll} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <Camera className="h-4 w-4" />}
              Capture Face
            </Button>
          </>
        ) : (
          <Button onClick={startCamera} className="gap-2">
            <Camera className="h-4 w-4" />
            {enrolled ? "Re-enroll Face" : "Begin Enrollment"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
