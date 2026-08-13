import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PreviewArticle = {
  id?: string;
  slug: string;
  title: string;
  dek: string;
  topic_tags: string[];
  published_at?: string | null;
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const ArticleCard = ({
  article,
  highlight,
}: {
  article: PreviewArticle;
  highlight?: boolean;
}) => (
  <Card className={highlight ? "ring-2 ring-primary" : undefined}>
    <CardHeader>
      <CardTitle className="text-xl">{article.title || "Untitled article"}</CardTitle>
      {article.published_at && (
        <p className="text-xs text-muted-foreground">{formatDate(article.published_at)}</p>
      )}
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-foreground/90">{article.dek}</p>
      {article.topic_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {article.topic_tags.map((t) => (
            <Badge key={t} variant="outline" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: PreviewArticle;
  seo?: ArticleLdInput;
  siblings: PreviewArticle[];
  confirming?: boolean;
  onConfirm: () => void;
};

export const ArticlePublishPreview = ({
  open,
  onOpenChange,
  draft,
  seo,
  siblings,
  confirming,
  onConfirm,
}: Props) => {
  const preview: PreviewArticle = {
    ...draft,
    published_at: draft.published_at || new Date().toISOString(),
  };

  const ld = useMemo(() => (seo ? buildArticleLd(seo) : null), [seo]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview on /articles</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="card" className="space-y-4">
          <TabsList>
            <TabsTrigger value="card">Card</TabsTrigger>
            <TabsTrigger value="seo">SEO and structured data</TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This is how the article card will appear in the public list, shown next to the two
              most recent published articles for context. Nothing is saved until you confirm.
            </p>

            <div className="border border-border rounded-md p-4 bg-background">
              <div className="grid gap-6 md:grid-cols-2">
                <ArticleCard article={preview} highlight />
                {siblings.slice(0, 2).map((a) => (
                  <ArticleCard key={a.id || a.slug} article={a} />
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Public URL: <span className="font-mono">/articles/{preview.slug}</span>
              </p>
              {!preview.dek?.trim() && <p>No summary set. The card body will be blank.</p>}
              {(!preview.topic_tags || preview.topic_tags.length === 0) && (
                <p>No topic tags set. The article will not appear under any topic filter.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            {!ld ? (
              <p className="text-sm text-muted-foreground">No draft data available.</p>
            ) : (
              <>
                <div className="border border-border rounded-md p-4 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Head metadata
                  </p>
                  <dl className="text-sm space-y-1">
                    <div>
                      <dt className="text-xs text-muted-foreground">title</dt>
                      <dd className="font-mono break-all">{ld.head.title}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">meta description</dt>
                      <dd className="font-mono break-all">{ld.head.description || "(empty)"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">canonical and og:url</dt>
                      <dd className="font-mono break-all">{ld.head.canonical}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">og:type</dt>
                      <dd className="font-mono">{ld.head.ogType}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Schema types emitted
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ld.emittedTypes.map((t) => (
                      <Badge key={t} variant="default" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 pt-1">
                    {ld.notEmitted.map((n) => (
                      <li key={n.type}>
                        <span className="font-mono">{n.type}</span>: not emitted. {n.reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {ld.warnings.length > 0 && (
                  <div className="border border-border rounded-md p-3 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Checks
                    </p>
                    <ul className="text-xs space-y-1 text-foreground/90">
                      {ld.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    JSON-LD as the prerenderer will emit it
                  </p>
                  <pre className="text-xs font-mono bg-muted/40 border border-border rounded-md p-3 overflow-x-auto max-h-80">
                    {JSON.stringify(ld.graph, null, 2)}
                  </pre>
                  <p className="text-xs text-muted-foreground">
                    articleBody and citation are shown abbreviated here. The live page emits the
                    full body text and resolves each related record to its own URL.
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirming}>
            Back to editor
          </Button>
          <Button onClick={onConfirm} disabled={confirming}>
            {confirming ? "Publishing..." : "Confirm publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

