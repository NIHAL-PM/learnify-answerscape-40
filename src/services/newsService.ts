
import { v4 as uuidv4 } from 'uuid';
import { ExamType, NewsItem } from '@/types';
import { toast } from '@/hooks/use-toast';

// We'll use a variety of news APIs for redundancy and freshness
const NEWS_API_SOURCES = [
  'https://saurav.tech/NewsAPI/top-headlines/category/general/in.json',
  'https://saurav.tech/NewsAPI/top-headlines/category/business/in.json',
  'https://saurav.tech/NewsAPI/top-headlines/category/science/in.json',
  'https://saurav.tech/NewsAPI/top-headlines/category/technology/in.json',
  // Add more news sources or categories as needed
];

// Try alternative news APIs if the primary one fails
const FALLBACK_NEWS_SOURCES = [
  'https://api.nytimes.com/svc/topstories/v2/world.json?api-key=yourkey', // Replace with actual API keys in production
  'https://newsapi.org/v2/top-headlines?country=in&apiKey=yourkey', // Replace with actual API keys in production
];

interface ApiNewsItem {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

// Cache configuration
const CACHE_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes in milliseconds
let lastFetchAttempt = 0; // Track last fetch attempt to avoid hammering APIs

const mapToExamTypes = (title: string, description: string): ExamType[] => {
  const content = (title + ' ' + description).toLowerCase();
  const examMappings = [
    { exam: 'UPSC' as ExamType, keywords: ['upsc', 'civil service', 'ias', 'ips', 'union public service'] },
    { exam: 'PSC' as ExamType, keywords: ['psc', 'public service', 'state service'] },
    { exam: 'SSC' as ExamType, keywords: ['ssc', 'staff selection', 'staff service'] },
    { exam: 'Banking' as ExamType, keywords: ['bank', 'rbi', 'reserve bank', 'finance', 'economy', 'banking'] }
  ];

  return examMappings
    .filter(mapping => mapping.keywords.some(keyword => content.includes(keyword)))
    .map(mapping => mapping.exam);
};

const guessCategory = (title: string, description: string): string => {
  const content = (title + ' ' + description).toLowerCase();
  
  const categoryMappings = [
    { category: 'Politics', keywords: ['politic', 'election', 'parliament', 'congress', 'government', 'minister'] },
    { category: 'Economy', keywords: ['econom', 'finance', 'market', 'stock', 'trade', 'gdp', 'inflation'] },
    { category: 'Science & Technology', keywords: ['tech', 'science', 'research', 'innovation', 'discovery'] },
    { category: 'Environment', keywords: ['environment', 'climate', 'pollution', 'sustainable', 'green'] },
    { category: 'International Relations', keywords: ['international', 'diplomacy', 'foreign', 'global', 'world'] },
    { category: 'Sports', keywords: ['sport', 'olympic', 'championship', 'tournament', 'athlete'] },
    { category: 'Health', keywords: ['health', 'medical', 'disease', 'hospital', 'doctor', 'patient'] }
  ];

  for (const mapping of categoryMappings) {
    if (mapping.keywords.some(keyword => content.includes(keyword))) {
      return mapping.category;
    }
  }
  
  return 'General';
};

const convertApiNewsToNewsItem = (item: ApiNewsItem): NewsItem => {
  const relevantExams = mapToExamTypes(item.title, item.description || '');
  const category = guessCategory(item.title, item.description || '');
  
  return {
    id: uuidv4(),
    title: item.title,
    description: item.description || 'No description available',
    url: item.url,
    source: item.source.name,
    publishedAt: item.publishedAt,
    imageUrl: item.urlToImage,
    category,
    relevantForExams: relevantExams.length ? relevantExams : ['UPSC', 'PSC', 'SSC', 'Banking']
  };
};

// Check if the news cache is outdated (update every 3 minutes)
const isCacheOutdated = (): boolean => {
  try {
    const lastCached = localStorage.getItem('news_cached_at');
    if (!lastCached) return true;
    
    const cachedTime = new Date(lastCached).getTime();
    const currentTime = new Date().getTime();
    
    return (currentTime - cachedTime) > CACHE_REFRESH_INTERVAL;
  } catch (error) {
    console.error('Error checking cache timestamp:', error);
    return true;
  }
};

// Check if we should attempt a new fetch (to prevent hammering APIs on errors)
const shouldAttemptFetch = (): boolean => {
  const currentTime = new Date().getTime();
  // Only attempt a new fetch if it's been at least 30 seconds since the last attempt
  const shouldFetch = (currentTime - lastFetchAttempt) > 30000;
  
  if (shouldFetch) {
    lastFetchAttempt = currentTime;
  }
  
  return shouldFetch;
};

export const fetchNews = async (examType?: ExamType): Promise<NewsItem[]> => {
  try {
    console.log('Fetching news, checking cache first...');
    // Try to get cached news first
    const cachedNews = getCachedNews(examType);
    
    // Return cached news if they're from within the cache interval
    if (cachedNews.length > 0 && !isCacheOutdated()) {
      console.log('Using cached news from within the last 3 minutes');
      return cachedNews;
    }
    
    // Don't hammer APIs if we've tried recently and failed
    if (!shouldAttemptFetch() && cachedNews.length > 0) {
      console.log('Recent fetch attempt failed, using cached data');
      return cachedNews;
    }
    
    // Cache outdated or empty, fetch fresh news
    console.log('Cache outdated or empty. Fetching fresh news...');
    const fetchPromises = NEWS_API_SOURCES.map(endpoint => 
      fetch(endpoint, { 
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store'
      })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch from ${endpoint}`);
          return res.json();
        })
        .catch(err => {
          console.warn(`Error fetching news from ${endpoint}:`, err);
          return { articles: [] };
        })
    );
    
    const results = await Promise.allSettled(fetchPromises);
    let allNews: ApiNewsItem[] = [];
    
    // Process successful results
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.articles && Array.isArray(result.value.articles)) {
        allNews = [...allNews, ...result.value.articles];
      }
    });
    
    // If we couldn't get any news, try fallback sources
    if (allNews.length === 0) {
      console.warn('Primary news sources failed, trying fallbacks');
      // Implementation for fallback sources would go here
      // For now, we'll return cached news as last resort
      if (cachedNews.length > 0) {
        return cachedNews;
      }
    }
    
    // Convert all news items to our format
    const newsItems = allNews.map(convertApiNewsToNewsItem);
    
    // Cache the new results with current timestamp
    if (newsItems.length > 0) {
      cacheNews(newsItems);
      console.log(`Successfully fetched ${newsItems.length} new news items`);
    }
    
    // If examType is provided, filter news relevant to that exam
    if (examType) {
      return newsItems.filter(item => 
        item.relevantForExams.includes(examType)
      );
    }
    
    return newsItems;
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return cached news as fallback, even if expired
    return getCachedNews(examType);
  }
};

// Get cached news
export const getCachedNews = (examType?: ExamType): NewsItem[] => {
  try {
    const cachedNews = localStorage.getItem('cached_news');
    if (!cachedNews) return [];
    
    const news: NewsItem[] = JSON.parse(cachedNews);
    
    if (examType) {
      return news.filter(item => item.relevantForExams.includes(examType));
    }
    
    return news;
  } catch (error) {
    console.error('Error reading cached news:', error);
    return [];
  }
};

// Store news in localStorage with current date
export const cacheNews = (news: NewsItem[]) => {
  try {
    localStorage.setItem('cached_news', JSON.stringify(news));
    localStorage.setItem('news_cached_at', new Date().toISOString());
    console.log('News cached at:', new Date().toISOString());
  } catch (error) {
    console.error('Error caching news:', error);
  }
};

// Function to check if news should be refreshed (useful for components to call)
export const shouldRefreshNews = (): boolean => {
  return isCacheOutdated();
};

// Function to force a refresh of the news cache
export const forceRefreshNews = async (examType?: ExamType): Promise<NewsItem[]> => {
  // Clear the cache timestamp to force a refresh
  localStorage.removeItem('news_cached_at');
  // Reset the last fetch attempt to allow immediate fetching
  lastFetchAttempt = 0;
  
  // Fetch fresh news
  return await fetchNews(examType);
};

// Get the time remaining until next auto-refresh
export const getTimeUntilNextRefresh = (): number => {
  try {
    const lastCached = localStorage.getItem('news_cached_at');
    if (!lastCached) return 0;
    
    const cachedTime = new Date(lastCached).getTime();
    const currentTime = new Date().getTime();
    const timeElapsed = currentTime - cachedTime;
    
    // Return time remaining in seconds
    return Math.max(0, Math.round((CACHE_REFRESH_INTERVAL - timeElapsed) / 1000));
  } catch (error) {
    return 0;
  }
};
