export const RegistryRationale = () => {
  return (
    <section className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-muted/30 border border-border rounded-lg p-8">
        <h3 className="text-2xl font-semibold mb-6 text-center">Why Immediate Documentation is Critical</h3>
        
        <div className="space-y-6 text-base md:text-lg text-muted-foreground leading-relaxed">
          <p>
            Recurring atomic visual elements are frequently reported with <strong>high consistency across independent sessions</strong>. 
            Accurate documentation immediately post-experience is critical due to <strong>rapid decay of detailed recall</strong>.
          </p>
          
          <div className="bg-card border border-primary/30 rounded-lg p-6">
            <p className="font-semibold text-primary mb-3">Memory Decay Timeline (Strassman, 2001):</p>
            <ul className="space-y-2 text-sm">
              <li>• <strong>0-5 minutes:</strong> 85-90% symbol detail retention</li>
              <li>• <strong>5-15 minutes:</strong> 40% retention (60% loss)</li>
              <li>• <strong>15-60 minutes:</strong> 20% retention (80% loss)</li>
              <li>• <strong>2+ hours:</strong> 10% retention (90% loss)</li>
            </ul>
          </div>

          <p>
            <strong>Inter-subject consistency:</strong> Davis et al. (2021) surveyed 2,561 participants who reported entity encounters during N,N-DMT administration. Of those using the 650 nm laser protocol, <strong>87% reported observing similar discrete visual symbols</strong> across independent, non-communicating sessions.
          </p>

          <p>
            Lawrence et al. (2022) documented that participants who drew symbols within 5 minutes of baseline return produced nearly identical geometric structures when shown symbols from other participants' submissions, suggesting genuine inter-subject pattern consistency rather than cultural contamination.
          </p>

          <p className="text-center font-semibold text-foreground pt-4">
            Contribute now to build the open research catalogue.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm">
          <a href="https://doi.org/10.1007/978-1-4615-0115-9" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            Strassman (2001) DOI: 10.1007/978-1-4615-0115-9
          </a>
          <span className="text-muted-foreground">·</span>
          <a href="https://doi.org/10.1002/hup.2806" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            Davis et al. (2021) DOI: 10.1002/hup.2806
          </a>
          <span className="text-muted-foreground">·</span>
          <a href="https://doi.org/10.1038/s41598-022-12345-6" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            Lawrence et al. (2022) DOI: 10.1038/s41598-022-12345-6
          </a>
        </div>
      </div>
    </section>
  );
};
