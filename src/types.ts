export interface College {
  id: string;
  name: string;
  location: string;
  state?: string;
  city?: string;
  rating: number;
  fees: number;
  popularFor: string;
  type?: string;
  imgUrl: string;
  details?: CollegeDetails;
  cutoffs?: Cutoff[];
  placementStats?: Array<{
    highestPackage: number;
    averagePackage: number;
    placementPercentage: number;
  }>;
}

export interface CollegeDetails {
  id: string;
  collegeId: string;
  description: string;
  imageUrl: string;
  programs: string;
}

export interface Cutoff {
  id: string;
  collegeId: string;
  examName: string;
  maxRank: number;
  category?: string;
}
