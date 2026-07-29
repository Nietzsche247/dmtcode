export const RegistryRationale = () => {
  return (
    <section className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-muted/30 border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold mb-6 text-center">Why immediate documentation matters</h3>

        <div className="space-y-6 text-base md:text-lg text-muted-foreground leading-relaxed">
          <p>
            Whether reports from different people genuinely converge is the open question this project exists
            to answer. The registry does not assert that they do. What it can do is collect records good enough
            to test that question, and the quality of a record depends heavily on when it was made.
          </p>

          <div className="bg-card border border-primary/30 rounded-lg p-6">
            <p className="font-semibold text-primary mb-3">Why immediate capture matters</p>
            <p className="text-sm">
              Recall of fine visual detail from the experience degrades rapidly once the acute effects subside. Sketching or describing what was observed as soon as the session ends preserves far more structural detail than recording the same content later, when only broad impressions tend to remain.
            </p>
          </div>

          <p>
            Timing is not the only thing that matters. A record made after the person has already browsed this
            catalogue cannot show independent convergence, because the forms shown here become part of what is
            being remembered. That is why the capture route exists, and why every submission records whether the
            catalogue had been seen first.
          </p>

          <p className="text-sm">
            This section previously cited two studies in support of a consistency claim. One citation pointed to
            an unrelated paper, and the other used a DOI that does not resolve. Both have been removed rather
            than replaced, because no verified source for that claim has been found.
          </p>

          <p className="text-center font-semibold text-foreground pt-4">
            Contribute now to build the open research catalogue.
          </p>
        </div>
      </div>
    </section>
  );
};
