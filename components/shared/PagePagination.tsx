'use client';

import { Pagination } from '@/components/ui';

interface PagePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: { navigation: string; previous: string; next: string };
  size?: 'sm' | 'md';
  className?: string;
}

function getPageNumbers(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (page > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (page < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

export function PagePagination({
  page,
  totalPages,
  onPageChange,
  labels,
  size = 'md',
  className,
}: PagePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={className}>
      <div className="w-full overflow-x-auto sm:max-w-full">
        <Pagination aria-label={labels.navigation} className="justify-center" size={size}>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={page === 1}
                onPress={() => {
                  onPageChange(page - 1);
                }}
              >
                <Pagination.PreviousIcon />
                <span>{labels.previous}</span>
              </Pagination.Previous>
            </Pagination.Item>

            {getPageNumbers(page, totalPages).map((item, index) =>
              item === 'ellipsis' ? (
                <Pagination.Item key={`ellipsis-${index}`}>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              ) : (
                <Pagination.Item key={item}>
                  <Pagination.Link
                    isActive={item === page}
                    onPress={() => {
                      onPageChange(item);
                    }}
                  >
                    {item}
                  </Pagination.Link>
                </Pagination.Item>
              )
            )}

            <Pagination.Item>
              <Pagination.Next
                isDisabled={page === totalPages}
                onPress={() => {
                  onPageChange(page + 1);
                }}
              >
                <span>{labels.next}</span>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </div>
    </div>
  );
}
