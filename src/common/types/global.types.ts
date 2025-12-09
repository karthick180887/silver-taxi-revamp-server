// types for query parameters
export interface QueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface BookingFilterParams extends QueryParams {
    bookingConfirmed?: boolean;
    contacted?: boolean;
    notContacted?: boolean;
    notStarted?: boolean;
    started?: boolean;
    completed?: boolean;
    cancelled?: boolean;
    vendor?: boolean;
}