import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SignInToContributeProps {
  title: string;
  body: string;
}

export const SignInToContribute = ({ title, body }: SignInToContributeProps) => {
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);

  return (
    <Card className="max-w-2xl mx-auto p-8 text-center space-y-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{body}</p>
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Button asChild size="lg">
          <a href={`/auth?mode=signup&returnTo=${returnTo}`}>Create an account</a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href={`/auth?returnTo=${returnTo}`}>I already have one</a>
        </Button>
      </div>
    </Card>
  );
};

export default SignInToContribute;
