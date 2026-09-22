"use client";

import { useMe, useUpdateProfile, useChangePassword } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import { PageLoader, SectionHeader, StatusBadge } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAvatarUrl, getInitials, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useEffect, useRef } from "react";
import { Camera, KeyRound, User } from "lucide-react";

const profileSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  date_of_birth: z.string().optional().refine(
    (value) => !value || new Date(`${value}T00:00:00`) <= new Date(),
    "Birthday cannot be in the future",
  ),
  phone_number: z.string().optional(),
});

const passwordSchema = z.object({
  old_password: z.string().min(1, "Required"),
  new_password: z.string().min(8, "Min 8 characters"),
  new_password_confirm: z.string(),
}).refine((d) => d.new_password === d.new_password_confirm, {
  message: "Passwords do not match",
  path: ["new_password_confirm"],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export function AccountSettingsPage() {
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useMe();
  const { mutate: updateProfile, isPending: updating } = useUpdateProfile();
  const { mutate: changePassword, isPending: changingPwd } = useChangePassword();
  const avatarRef = useRef<HTMLInputElement>(null);

    const profileForm = useForm<ProfileData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            phone_number: "",
        },
    });
    const passwordForm = useForm<PasswordData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            old_password: "",
            new_password: "",
            new_password_confirm: "",
        },
    });

    const initialized = useRef(false);
    const resetProfile = profileForm.reset;

    useEffect(() => {
        if (profile && !initialized.current) {
            resetProfile({
            first_name: profile.first_name ?? "",
            last_name: profile.last_name ?? "",
            date_of_birth: profile.date_of_birth ?? "",
            phone_number: profile.phone_number ?? "",
            });
            initialized.current = true;
        }
    }, [profile, resetProfile]);

  if (isLoading || !user) return <PageLoader />;

  const onProfileSubmit = (data: ProfileData) => updateProfile(data);
  const onPasswordSubmit = (data: PasswordData) => {
    changePassword(data, { onSuccess: () => passwordForm.reset() });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateProfile({ avatar: file });
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Account settings" description="Manage your personal information, learning age, and security." />

      {/* Profile header card */}
      <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-6">
        <div className="relative">
          <Avatar className="h-20 w-20">
              <AvatarImage src={getAvatarUrl(profile?.avatar || user.avatar) ?? undefined} />
              <AvatarFallback>
              {getInitials(user.full_name)}
          </AvatarFallback>
          </Avatar>
          <button
            onClick={() => avatarRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div>
            <h2 className="font-display text-xl font-bold text-foreground">
                {user.full_name}
            </h2>
            <p className="text-sm text-muted-foreground">
                {user.email}
            </p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={user.role} />
            {user.is_email_verified && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Member since {formatDate(user.created_at)}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="mb-6">
          <TabsTrigger value="info" className="gap-2">
            <User className="h-4 w-4" />Personal Info
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <KeyRound className="h-4 w-4" />Security
          </TabsTrigger>
        </TabsList>

        {/* Personal info */}
        <TabsContent value="info">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-5 font-display font-semibold text-foreground">Personal Information</h3>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input {...profileForm.register("first_name")} />
                  {profileForm.formState.errors.first_name && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input {...profileForm.register("last_name")} />
                  {profileForm.formState.errors.last_name && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Email address</Label>
                  <Input value={user.email ?? ""} disabled className="cursor-not-allowed opacity-60" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date_of_birth">Birthday</Label>
                <Input id="date_of_birth" type="date" max={new Date().toISOString().slice(0, 10)} {...profileForm.register("date_of_birth")} />
                <p className="text-xs text-muted-foreground">This selects age-appropriate learning modules.</p>
                {profileForm.formState.errors.date_of_birth && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.date_of_birth.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Phone number</Label>
                <Input placeholder="+1 555 000 0000" {...profileForm.register("phone_number")} />
              </div>

              <div className="space-y-1.5">
                <Label>Role</Label>
                  <Input value={user.role ?? ""} disabled className="cursor-not-allowed capitalize opacity-60" />
              </div>

              <Button type="submit" disabled={updating}>
                {updating ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-5 font-display font-semibold text-foreground">Change Password</h3>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input type="password" {...passwordForm.register("old_password")} />
                {passwordForm.formState.errors.old_password && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.old_password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input type="password" placeholder="Min. 8 characters" {...passwordForm.register("new_password")} />
                {passwordForm.formState.errors.new_password && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Confirm new password</Label>
                <Input type="password" {...passwordForm.register("new_password_confirm")} />
                {passwordForm.formState.errors.new_password_confirm && (
                  <p className="text-xs text-destructive">{passwordForm.formState.errors.new_password_confirm.message}</p>
                )}
              </div>

              <Button type="submit" disabled={changingPwd}>
                {changingPwd ? "Changing…" : "Update password"}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return <AccountSettingsPage />;
}
