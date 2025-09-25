export interface BlaneImage {
    id: number;
    blaneId: number;
    imageUrl: string;
    isPrimary: boolean;
    position: number;
    createdAt: string;
    updatedAt: string;
    imageLink: string;
}

export interface BlaneimgFormData {
    blane_id: number;
    image_url: File;
}

  