// The metadata stored for a photo
interface PhotoMetadata {
  id: string;
  filename: string;
  stats: any;
  type: string;
  size: number;
  uploadedDate: Date;
  albums: string[];
}
