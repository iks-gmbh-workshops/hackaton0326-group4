import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TermsSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

const termsSections: TermsSection[] = [
  {
    title: '1. Scope',
    paragraphs: [
      'These Terms of Service govern your use of DrumDiBum, a web application for organizing groups, managing invitations, planning activities, and tracking RSVPs.',
      'By registering for an account or using the application, you agree to these terms.',
    ],
  },
  {
    title: '2. Accounts',
    paragraphs: [
      'You must provide accurate registration information and keep your login credentials confidential.',
      'You are responsible for activity carried out through your account until unauthorized access is reported to the operator of the DrumDiBum instance you use.',
    ],
  },
  {
    title: '3. Acceptable Use',
    paragraphs: [
      'You agree to use DrumDiBum only for lawful, respectful coordination of shared groups and activities.',
    ],
    items: [
      'Send invitations only to people you are allowed to contact.',
      'Do not share unlawful, abusive, deceptive, or harmful content through the service.',
      'Do not attempt to disrupt the service, bypass security controls, or access data that is not meant for you.',
    ],
  },
  {
    title: '4. Group and Activity Data',
    paragraphs: [
      'You remain responsible for the names, descriptions, invitations, and activity details you create in DrumDiBum.',
      'When you join a group, other members of that group may see information needed to coordinate shared activities, including your name, email address, and RSVP status.',
    ],
  },
  {
    title: '5. Availability and Changes',
    paragraphs: [
      'DrumDiBum is provided on a best-effort basis. Features may be changed, improved, restricted, or removed over time.',
      'Access may be suspended or terminated for misuse, security reasons, maintenance, or other operational needs.',
    ],
  },
  {
    title: '6. Account Deletion and Data Removal',
    paragraphs: [
      'You can delete your account from the profile page. Account deletion removes your user data and related memberships, invitations, and RSVP records as supported by the application.',
      'Use of the service remains subject to any additional privacy or data-protection notices provided by the operator of the DrumDiBum instance you are using.',
    ],
  },
  {
    title: '7. Contact',
    paragraphs: [
      'If you have questions about these terms, please contact the operator or administrator of the DrumDiBum instance you are using.',
    ],
  },
];

export function TermsOfServicePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-28">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">DrumDiBum</p>
        <h1 className="text-4xl">Terms of Service</h1>
        <div className="h-px w-24 bg-border" />
        <p className="max-w-2xl text-muted-foreground">
          These terms describe the basic rules for using DrumDiBum to organize groups and shared activities.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Using DrumDiBum</CardTitle>
          <CardDescription>Last updated: March 26, 2026</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 py-2">
          {termsSections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-6 text-foreground">
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-foreground">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </CardContent>
      </Card>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Registration requires accepting these terms.</p>
          <Button variant="outline" className="w-full sm:w-auto" render={<Link to="/register" />}>
            Back to registration
          </Button>
        </div>
      </footer>
    </div>
  );
}
