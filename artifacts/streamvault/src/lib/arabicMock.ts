export interface ArabicTitle {
  id: string;
  title: string;
  titleEn: string;
  year: number;
  type: 'movie' | 'series';
  rating: number;
  poster: string;  // Use TMDB image path
  tmdbId: number;
  source: 'wecima' | 'egybest' | 'arabseed' | 'akoam';
}

// Real TMDB IDs for popular Arabic / dubbed films
export const arabicMovies: ArabicTitle[] = [
  { id: 'ar1', title: 'ولاد رزق 3', titleEn: 'Welad Rizk 3', year: 2023, type: 'movie', rating: 7.2, poster: '/aJCtkxLLzkk1pECehVjK5s2lnSd.jpg', tmdbId: 761743, source: 'wecima' },
  { id: 'ar2', title: 'كيرة والجن', titleEn: 'Kira and the Gen', year: 2022, type: 'movie', rating: 6.9, poster: '/kuf6dutpsT0vSVehic3EZIqkOBt.jpg', tmdbId: 927107, source: 'egybest' },
  { id: 'ar3', title: 'الحرب العالمية الثالثة', titleEn: 'World War III', year: 2022, type: 'movie', rating: 6.8, poster: '/6eTMRHSbdRJJFBpBkVlxoYGnHN2.jpg', tmdbId: 861374, source: 'arabseed' },
  { id: 'ar4', title: 'قضية رقم 23', titleEn: 'The Insult', year: 2017, type: 'movie', rating: 7.5, poster: '/hqepnLTRaEjFehCNvAHBRXgQGiJ.jpg', tmdbId: 391713, source: 'wecima' },
  { id: 'ar5', title: 'ريش', titleEn: 'Feathers', year: 2021, type: 'movie', rating: 6.9, poster: '/5B9YbKwbGPXB9C3d4lGbhJvHaHs.jpg', tmdbId: 862577, source: 'egybest' },
  { id: 'ar6', title: 'أصحاب ولا بيزنس', titleEn: 'Ashabak Wala Business', year: 2023, type: 'movie', rating: 6.5, poster: '/7E6RaFZW6WNrDBfI5yd9JMO8hLi.jpg', tmdbId: 1022789, source: 'akoam' },
];

export const arabicSeries: ArabicTitle[] = [
  { id: 'ars1', title: 'كلبش', titleEn: 'Kalabsh', year: 2017, type: 'series', rating: 8.1, poster: '/3Rfvhy1Nl6SkAfFGsrMuHRuOJec.jpg', tmdbId: 73244, source: 'wecima' },
  { id: 'ars2', title: 'الهيبة', titleEn: 'Al Hayba', year: 2017, type: 'series', rating: 7.8, poster: '/bgSfPpRBKuBo6QNrB9Ek1hcMJBi.jpg', tmdbId: 72544, source: 'egybest' },
  { id: 'ars3', title: 'اللؤلؤة', titleEn: 'The Pearl', year: 2022, type: 'series', rating: 7.2, poster: '/aCi9ZFPBBgBIjXFpUjrMBf0fEer.jpg', tmdbId: 152532, source: 'arabseed' },
  { id: 'ars4', title: 'نسل الأغراب', titleEn: 'Nasl Al Aghrab', year: 2021, type: 'series', rating: 8.0, poster: '/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg', tmdbId: 130384, source: 'akoam' },
];

export const IMAGE_BASE = "https://image.tmdb.org/t/p/";
