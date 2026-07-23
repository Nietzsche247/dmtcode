export const MissionFraming = () => {
  return (
    <section
      aria-label="Mission"
      className="container mx-auto px-4 py-16 md:py-20 max-w-3xl"
    >
      <div className="space-y-6">
        <p className="label-data text-xs text-primary">THE PROJECT</p>
        <p
          className="text-sm md:text-base text-muted-foreground leading-relaxed"
          style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
        >
          The open record of a reported observation: first described by Danny Goler in 2020,
          published as a pilot study in 2025, and unresolved. We keep the evidence, including the
          evidence against.
        </p>
        <h2
          className="text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
        >
          Thousands of strangers keep seeing the same hidden world. You might have seen it too.
        </h2>

        <p
          className="text-lg md:text-xl text-muted-foreground leading-relaxed"
          style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
        >
          This is not a claim. It is an experiment, and you can be part of it. We record what people
          see and test it honestly, together, until we know what is real.
        </p>

        <p
          className="text-lg md:text-xl text-muted-foreground leading-relaxed"
          style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
        >
          Sign in and add what you saw. That is what turns a story into evidence and keeps the
          record real. Your identity stays private.
        </p>

        <p
          className="text-base md:text-lg text-foreground/80 leading-relaxed pt-2 border-l-2 border-primary/60 pl-5"
          style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
        >
          We do not know the answer yet. That is the point. Whatever is there, we will see it
          clearly, and we will tell you the truth.
        </p>
      </div>
    </section>
  );
};
