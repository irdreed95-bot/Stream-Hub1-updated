export interface StreamSource {
  id: string;
  name: string;
  group: 'A' | 'B' | 'C' | 'D';
  getUrl: (id: string | number, type: 'movie' | 'tv', season?: number, episode?: number) => string | null;
}

export const sources: StreamSource[] = [
  // Group A - Embed Iframes
  {
    id: 'vidsrc-to',
    name: 'VidSrc To',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie' 
      ? `https://vidsrc.to/embed/movie/${id}` 
      : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc-me',
    name: 'VidSrc Me',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://vidsrc.me/embed/movie?tmdb=${id}`
      : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
  },
  {
    id: 'embed-su',
    name: 'Embed Su',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://embed.su/embed/movie/${id}`
      : `https://embed.su/embed/tv/${id}/${s}/${e}`
  },
  {
    id: '2embed',
    name: '2Embed',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://www.2embed.cc/embed/${id}`
      : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  },
  {
    id: 'smashystream',
    name: 'SmashyStream',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://embed.smashystream.com/playere.php?tmdb=${id}`
      : `https://embed.smashystream.com/playere.php?tmdb=${id}&type=tv&season=${s}&episode=${e}`
  },
  {
    id: 'vidsrc-cc',
    name: 'VidSrc CC',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://vidsrc.cc/embed/movie/${id}`
      : `https://vidsrc.cc/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidsrc-xyz',
    name: 'VidSrc XYZ',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://vidsrc.xyz/embed/movie/${id}`
      : `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://autoembed.to/movie/tmdb/${id}`
      : `https://autoembed.to/tv/tmdb/${id}-${s}-${e}`
  },
  {
    id: 'movieapi',
    name: 'MovieAPI',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://movieapi.club/movie/${id}`
      : `https://movieapi.club/tv/${id}-${s}-${e}`
  },
  {
    id: 'videasy',
    name: 'Videasy',
    group: 'A',
    getUrl: (id, type, s, e) => type === 'movie'
      ? `https://player.videasy.net/movie/${id}`
      : `https://player.videasy.net/tv/${id}?season=${s}&episode=${e}`
  },
  
  // Group B - Direct
  { id: 'doodstream', name: 'DoodStream', group: 'B', getUrl: () => null },
  { id: 'streamtape', name: 'Streamtape', group: 'B', getUrl: () => null },
  { id: 'filemoon', name: 'Filemoon', group: 'B', getUrl: () => null },
  { id: 'uqload', name: 'Uqload', group: 'B', getUrl: () => null },
  { id: 'mixdrop', name: 'Mixdrop', group: 'B', getUrl: () => null },
  { id: 'vkvideo', name: 'VK Video', group: 'B', getUrl: () => null },

  // Group C - Scrapers
  { id: 'consumet', name: 'Consumet API', group: 'C', getUrl: () => null },
  { id: 'movieweb', name: 'Movie-Web', group: 'C', getUrl: () => null },
  { id: 'flixhq', name: 'FlixHQ', group: 'C', getUrl: () => null },

  // Group D - Arabic
  { id: 'wecima', name: 'WeCima/MyCima', group: 'D', getUrl: () => null },
  { id: 'egybest', name: 'EgyBest', group: 'D', getUrl: () => null },
  { id: 'arabseed', name: 'ArabSeed', group: 'D', getUrl: () => null },
  { id: 'akoam', name: 'Akoam', group: 'D', getUrl: () => null }
];