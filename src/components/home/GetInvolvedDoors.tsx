import { Link } from 'react-router-dom';
import { Eye, PencilLine, Users } from 'lucide-react';

interface Props {
  variant?: 'top' | 'bottom';
}

export const GetInvolvedDoors = ({ variant = 'top' }: Props) => {
  const doors = [
    {
      to: '/registry',
      title: 'I saw this',
      body: 'Browse the record. Confirm the forms you have already seen.',
      Icon: Eye,
      tone: 'ghost' as const,
    },
    {
      to: '/submit-symbol',
      title: 'Add what you saw',
      body: 'Reconstruct the form on a blank canvas. It joins the open record.',
      Icon: PencilLine,
      tone: 'primary' as const,
    },
    {
      to: '/join',
      title: 'Help build it',
      body: 'Volunteer as a recorder, translator, analyst, developer, or test subject.',
      Icon: Users,
      tone: 'secondary' as const,
    },
  ];

  return (
    <section
      aria-label="Get involved"
      className={variant === 'top' ? 'container mx-auto px-4 pt-4 pb-14 max-w-6xl' : 'container mx-auto px-4 py-24 max-w-6xl border-t border-border/40'}
    >
      {variant === 'bottom' && (
        <div className="text-center mb-10">
          <p className="label-data text-xs text-muted-foreground mb-3">GET INVOLVED</p>
          <h2
            className="text-3xl md:text-4xl text-foreground"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
          >
            Three ways in.
          </h2>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-4 md:gap-5">
        {doors.map(({ to, title, body, Icon, tone }) => {
          const base =
            'group relative flex flex-col gap-3 rounded-sm border p-6 md:p-7 transition-colors bg-card';
          const toneClass =
            tone === 'primary'
              ? 'border-primary/60 hover:border-primary hover:bg-primary/5'
              : tone === 'secondary'
              ? 'border-foreground/25 hover:border-foreground/50'
              : 'border-border hover:border-foreground/40';
          return (
            <Link key={to} to={to} className={`${base} ${toneClass}`}>
              <Icon className={`w-5 h-5 ${tone === 'primary' ? 'text-primary' : 'text-foreground/70'}`} aria-hidden />
              <h3
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
              >
                {title}
              </h3>
              <p
                className="text-sm text-muted-foreground leading-relaxed"
                style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
              >
                {body}
              </p>
              <span className="label-data text-[10px] text-primary mt-2 group-hover:underline">
                {tone === 'primary' ? 'PRIMARY' : 'ENTER'}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
