import { ArticleCard, type ArticleCardArticle } from './ArticleCard';

interface ArticlesGridProps {
  articles: ArticleCardArticle[];
  basePath?: '/insights' | '/academy';
  layout?: 'featured' | 'uniform';
}

function uniformTileClassName(index: number, total: number): string {
  const columnsDesktop = 3;
  const isLastRowMobile = index === total - 1;
  const isLastColumnDesktop = index % columnsDesktop === columnsDesktop - 1;
  const isLastRowDesktop =
    Math.floor(index / columnsDesktop) === Math.ceil(total / columnsDesktop) - 1;

  return [
    'border-border',
    isLastRowMobile ? '' : 'max-sm:border-b',
    isLastRowDesktop ? '' : 'sm:border-b',
    isLastColumnDesktop ? '' : 'sm:border-r',
  ]
    .filter(Boolean)
    .join(' ');
}

export function ArticlesGrid({
  articles,
  basePath = '/insights',
  layout = 'featured',
}: ArticlesGridProps) {
  if (layout === 'uniform') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.slug}
            article={article}
            basePath={basePath}
            className={uniformTileClassName(index, articles.length)}
          />
        ))}
      </div>
    );
  }

  const hasSecondRow = articles.length > 3;

  return (
    <>
      <div
        className={[
          'border-border grid grid-cols-1 lg:grid-cols-3',
          hasSecondRow ? 'border-b' : '',
        ].join(' ')}
      >
        {articles[0] && (
          <ArticleCard
            article={articles[0]}
            basePath={basePath}
            large
            className="border-border max-lg:border-b lg:col-span-2 lg:border-r"
          />
        )}
        <div className="flex flex-col">
          {articles[1] && (
            <ArticleCard
              article={articles[1]}
              basePath={basePath}
              showImage={false}
              className="border-border flex-1 border-b"
            />
          )}
          {articles[2] && (
            <ArticleCard
              article={articles[2]}
              basePath={basePath}
              showImage={false}
              className="flex-1"
            />
          )}
        </div>
      </div>

      {hasSecondRow && (
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {articles[3] && (
            <ArticleCard
              article={articles[3]}
              basePath={basePath}
              className="border-border max-sm:border-b sm:border-r"
            />
          )}
          {articles[4] && (
            <ArticleCard
              article={articles[4]}
              basePath={basePath}
              className="border-border max-sm:border-b sm:border-r"
            />
          )}
          {articles[5] && <ArticleCard article={articles[5]} basePath={basePath} />}
        </div>
      )}
    </>
  );
}

/** @deprecated Use ArticlesGrid */
export const InsightsGrid = ArticlesGrid;
