"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, HelpCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { encryptWithPassword } from "@/app/actions/client-crypto-actions";
import zxcvbn from "zxcvbn";

// Define the maximum content length
const MAX_CONTENT_LENGTH = 2000;

type FormData = {
  title?: string;
  content: string;
  delayValue: number;
  password: string;
};

// Time units in minutes
const TIME_UNITS = [
  { value: "1", label: "Minutes" },
  { value: "60", label: "Hours" },
  { value: "1440", label: "Days" },
  { value: "10080", label: "Weeks" },
];

export default function CreateLockForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [delayValue, setDelayValue] = useState(15);
  const [selectedUnit, setSelectedUnit] = useState(TIME_UNITS[0].value);
  const [contentLength, setContentLength] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: { warning: string; suggestions: string[] };
  }>({ score: 0, feedback: { warning: "", suggestions: [] } });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>();

  // Watch the content field to update character count
  const content = watch("content", "");
  const password = watch("password", "");

  // Update character count when content changes
  useEffect(() => {
    setContentLength(content.length);
  }, [content]);

  // Evaluate password strength when it changes
  useEffect(() => {
    if (password && usePassword) {
      const result = zxcvbn(password);
      setPasswordStrength({
        score: result.score,
        feedback: result.feedback,
      });
    } else {
      setPasswordStrength({ score: 0, feedback: { warning: "", suggestions: [] } });
    }
  }, [password, usePassword]);

  // Get password strength text
  const getStrengthText = (score: number): string => {
    switch (score) {
      case 0: return "Weak";
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      default: return "Weak";
    }
  };

  // Get password strength color
  const getStrengthColor = (score: number): string => {
    switch (score) {
      case 0: return "text-red-500";
      case 1: return "text-red-500";
      case 2: return "text-orange-500";
      case 3: return "text-green-500";
      case 4: return "text-green-600";
      default: return "text-red-500";
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      // Validate content length
      if (data.content.length > MAX_CONTENT_LENGTH) {
        toast.error(`Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
        setIsLoading(false);
        return;
      }

      // Calculate total delay in minutes
      const totalDelayMinutes = delayValue * parseInt(selectedUnit, 10);

      let submitData;

      // If password protection is enabled, encrypt on the client side
      if (usePassword && data.password) {
        try {
          // Encrypt the content in the browser
          const { encryptedContent, salt } = await encryptWithPassword(data.content, data.password);

          // Send the pre-encrypted content to the server
          submitData = {
            title: data.title,
            delayMinutes: totalDelayMinutes,
            encryptedContent, // Send pre-encrypted content
            salt, // Send the salt used for encryption
          };
        } catch (encryptError) {
          console.error("Client-side encryption failed:", encryptError);
          toast.error("Encryption failed. Please try again.");

          // Don't fall back to server-side encryption, just fail
          setIsLoading(false);
          return;
        }
      } else {
        // No password protection, server will encrypt with system key
        submitData = {
          title: data.title,
          content: data.content,
          delayMinutes: totalDelayMinutes,
        };
      }

      const response = await fetch("/api/locks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create lock");
      }

      const result = await response.json();

      // toast.success("Lock created successfully!");

      // Redirect to the lock page
      router.push(`/${result.id}`);
    } catch (error) {
      console.error("Error creating lock:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create lock. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Format the delay for display
  const formatDelay = () => {
    const unit = TIME_UNITS.find(u => u.value === selectedUnit)?.label.toLowerCase() || "minutes";
    return `${delayValue} ${delayValue === 1 ? unit.slice(0, -1) : unit}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Textarea
          id="content"
          placeholder="Type anything"
          className="min-h-[150px]"
          maxLength={MAX_CONTENT_LENGTH}
          {...register("content", {
            required: "Type something to lock",
            maxLength: {
              value: MAX_CONTENT_LENGTH,
              message: `Content cannot exceed ${MAX_CONTENT_LENGTH} characters`
            },
            onChange: (e) => setContentLength(e.target.value.length)
          })}
        />
        <div className="flex justify-between gap-2">
          {errors.content && (
            <p className="text-sm text-red-500">{errors.content.message}</p>
          )}
          {!errors.content && <div className="flex-gap"></div>}
          <p className={`text-sm ${contentLength > MAX_CONTENT_LENGTH ? 'text-red-500' : 'text-muted-foreground'}`}>
            {contentLength}/{MAX_CONTENT_LENGTH} characters
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Add an optional title"
          {...register("title")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="delay">Delay</Label>
        <div className="flex items-start gap-2 max-w-xs">
          <Input
            id="delayValue"
            type="number"
            min="1"
            value={delayValue}
            onChange={(e) => setDelayValue(parseInt(e.target.value) || 1)}
            className="bg-background"
          />
          <Select
            value={selectedUnit}
            onValueChange={(value) => setSelectedUnit(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {TIME_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Unlock will take {formatDelay()}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="use-password"
          checked={usePassword}
          onCheckedChange={setUsePassword}
        />
        <Label htmlFor="use-password">Encrypt with password</Label>
      </div>

      {usePassword && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter a secure password"
            {...register("password", {
              required: usePassword ? "Password is required" : false,
              validate: () => {
                if (usePassword && passwordStrength.score < 2) {
                  return "Password needs to be stronger";
                }
                return true;
              }
            })}
          />
          {password && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${getStrengthColor(passwordStrength.score)}`}>
                {getStrengthText(passwordStrength.score)}
              </span>
              {(passwordStrength.feedback.warning || passwordStrength.feedback.suggestions.length > 0) && (
                <Popover>
                  <PopoverTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      {passwordStrength.feedback.warning && (
                        <p className="text-sm text-amber-500">{passwordStrength.feedback.warning}</p>
                      )}
                      {passwordStrength.feedback.suggestions.length > 0 && (
                        <div>
                          <ul className="list-disc pl-5 space-y-1">
                            {passwordStrength.feedback.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-sm">{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Setting a password encrypts the content in your browser before it&apos;s sent to us
          </p>
        </div>
      )}

      <Button type="submit" className="w-full font-semibold text-2xl py-8" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Lock It"
        )}
      </Button>
    </form>
  );
} 