import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const optionalBounded = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer`).optional();

const preregistrationSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(300, 'Title must be 300 characters or fewer'),
  hypothesis: z.string().trim().min(10, 'Hypothesis must be at least 10 characters').max(4000, 'Hypothesis must be 4,000 characters or fewer'),
  method_summary: z.string().trim().min(10, 'Method summary must be at least 10 characters').max(6000, 'Method summary must be 6,000 characters or fewer'),
  instruments: optionalBounded(2000, 'Instruments'),
  contact_email: z.string().trim().max(254, 'Email must be 254 characters or fewer').regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Enter a valid email address'),
  orcid: optionalBounded(100, 'ORCID'),
  affiliation: optionalBounded(300, 'Affiliation'),
});

type PreregistrationValues = z.infer<typeof preregistrationSchema>;

const emptyToNull = (value?: string) => value?.trim() || null;

export function PreregistrationForm() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<PreregistrationValues>({
    resolver: zodResolver(preregistrationSchema),
    defaultValues: {
      title: '',
      hypothesis: '',
      method_summary: '',
      instruments: '',
      contact_email: '',
      orcid: '',
      affiliation: '',
    },
  });

  const onSubmit = async (values: PreregistrationValues) => {
    const { error } = await supabase.from("research_preregistrations").insert({
      title: values.title.trim(),
      hypothesis: values.hypothesis.trim(),
      method_summary: values.method_summary.trim(),
      instruments: emptyToNull(values.instruments),
      contact_email: values.contact_email.trim(),
      orcid: emptyToNull(values.orcid),
      affiliation: emptyToNull(values.affiliation),
    });

    if (error) {
      form.setError('root', { message: 'The pre-registration could not be submitted. Please try again.' });
      return;
    }

    await supabase.functions.invoke('notify-admin', {
      body: { type: 'preregistration' },
    }).catch(() => undefined);

    setSubmitted(true);
    form.reset();
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pre-registration received</CardTitle>
          <CardDescription>
            Your submission is now in the research intake queue. An administrator can inspect it and may contact you at the email address you provided.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-register a physiological instrumentation study</CardTitle>
        <CardDescription>
          Submit a proposed hypothesis and method for the open research call. Required fields are marked.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl><Input {...field} maxLength={300} autoComplete="off" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="hypothesis" render={({ field }) => (
              <FormItem>
                <FormLabel>Hypothesis *</FormLabel>
                <FormControl><Textarea {...field} minLength={10} maxLength={4000} rows={5} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="method_summary" render={({ field }) => (
              <FormItem>
                <FormLabel>Method summary *</FormLabel>
                <FormControl><Textarea {...field} minLength={10} maxLength={6000} rows={7} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="instruments" render={({ field }) => (
              <FormItem>
                <FormLabel>Instruments</FormLabel>
                <FormControl><Textarea {...field} maxLength={2000} rows={4} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-5 md:grid-cols-2">
              <FormField control={form.control} name="contact_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email *</FormLabel>
                  <FormControl><Input {...field} type="email" maxLength={254} autoComplete="email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="orcid" render={({ field }) => (
                <FormItem>
                  <FormLabel>ORCID</FormLabel>
                  <FormControl><Input {...field} maxLength={100} autoComplete="off" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="affiliation" render={({ field }) => (
              <FormItem>
                <FormLabel>Affiliation</FormLabel>
                <FormControl><Input {...field} maxLength={300} autoComplete="organization" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {form.formState.errors.root?.message && (
              <p className="text-sm font-medium text-destructive" role="alert">{form.formState.errors.root.message}</p>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Submitting...' : 'Submit pre-registration'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}