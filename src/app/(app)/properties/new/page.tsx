"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewPropertyPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create property");
      }
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (property) => {
      toast.success("Property created");
      router.push(`/properties/${property.id}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="font-display text-2xl">New property</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create property"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
