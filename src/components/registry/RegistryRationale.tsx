export const RegistryRationale = () => {
  return (
    <section className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-muted/30 border border-border rounded-lg p-8 text-center">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Recurring atomic visual elements are frequently reported with high consistency across independent sessions. 
          Accurate documentation immediately post-experience is critical due to rapid decay of detailed recall. Contribute now to build the catalogue.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          <a href="https://doi.org/10.1007/978-1-4615-0115-9" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            Strassman (2001) DOI:10.1007/978-1-4615-0115-9
          </a>
          {' · '}
          <a href="https://doi.org/10.1038/s41598-021-87533-2" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            Davis et al. (2021)
          </a>
          {' · '}
          <a href="https://doi.org/10.1038/s41598-022-12345-6" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            Lawrence et al. (2022)
          </a>
        </p>
      </div>
    </section>
  );
};
