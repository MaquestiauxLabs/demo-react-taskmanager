interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface Sorting {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface StandardResponse<T = unknown> {
  httpStatus: number;
  message: string;
  data?: T;
  error?: unknown;
  pagination?: Pagination;
  sorting?: Sorting;
}

interface props<T = unknown> {
  message: string;
  httpStatus: number;
  data?: T;
  error?: unknown;
  pagination?: Pagination;
  sorting?: Sorting;
}

export const standardiseResponse = <T = unknown>({
  message,
  httpStatus,
  data,
  error,
  pagination,
  sorting,
}: props<T>): StandardResponse<T> => {
  return {
    httpStatus: httpStatus,
    message: message,
    data: data,
    error: error,
    pagination: pagination,
    sorting: sorting,
  };
};
