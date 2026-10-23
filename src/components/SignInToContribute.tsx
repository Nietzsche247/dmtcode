import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SignInToContributeProps {
  title: string;
  body: string;
  createLabel?: string;
  signInLabel?: string;
  authPath?: string;
}

export const SignInToContribute = ({ title, body, createLabel = 'Create an account', signInLabel = 'I already have one', authPath = '/auth' }: SignInToContributeProps) => {
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);

  return (
    <Card className="max-w-2xl mx-auto p-8 text-center space-y-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{body}</p>
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Button asChild size="lg">
          <a href={`${authPath}?mode=signup&returnTo=${returnTo}`}>{createLabel}</a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href={`${authPath}?returnTo=${returnTo}`}>{signInLabel}</a>
        </Button>
      </div>
    </Card>
  );
};

export default SignInToContribute;
