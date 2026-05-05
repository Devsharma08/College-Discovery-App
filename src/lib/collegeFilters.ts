import { API_URL } from '../config';
import type { College } from '../types';
import { ApiClientError, apiFetch } from './api';

export interface CollegeFilterMeta {
  states: string[];
  cities: string[];
  facilities: string[];
  courses: string[];
}

const FALLBACK_COURSES = [
  'Architecture',
  'Business Administration',
  'Civil Engineering',
  'Commerce',
  'Computer Science and Engineering',
  'Dental Surgery',
  'Electrical Engineering',
  'Finance',
  'Information Technology',
  'Law',
  'Marketing Management',
  'Mathematics',
];

const uniqueSorted = (values: Array<string | undefined | null>) =>
  [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].sort();

export const getCollegeFilterMeta = async (): Promise<CollegeFilterMeta> => {
  try {
    const meta = await apiFetch<Partial<CollegeFilterMeta>>(`${API_URL}/api/colleges/meta/filters`);
    return {
      states: meta.states || [],
      cities: meta.cities || [],
      facilities: meta.facilities || [],
      courses: meta.courses?.length ? meta.courses : FALLBACK_COURSES,
    };
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 404) throw error;

    const colleges = await apiFetch<College[]>(`${API_URL}/api/colleges?limit=60`);
    return {
      states: uniqueSorted(colleges.map((college) => college.state)),
      cities: uniqueSorted(colleges.map((college) => college.city)),
      facilities: [],
      courses: uniqueSorted(colleges.map((college) => college.popularFor)).length
        ? uniqueSorted(colleges.map((college) => college.popularFor))
        : FALLBACK_COURSES,
    };
  }
};
