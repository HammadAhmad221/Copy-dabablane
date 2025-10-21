export interface AddOn {
    id?: number;
    title: string;
    price_ht: number;
    tooltip: string;
    max_quantity: number;
    is_active: boolean;
}

export interface AddOnResponse {
    data: {
        data: AddOn[];
        message?: string;
        success?: boolean;
    };
    message?: string;
    success?: boolean;
}