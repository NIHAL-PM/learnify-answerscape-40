
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const { action, category = 'general' } = await req.json();

    // Handle the get-news action
    if (action === 'get-news') {
      // First, check if we have recent cached news in the database
      const cacheTimeWindow = new Date();
      cacheTimeWindow.setHours(cacheTimeWindow.getHours() - 1); // Cache for 1 hour
      
      const { data: cachedNews, error: cacheError } = await supabase
        .from('news_articles')
        .select('*')
        .eq('category', category)
        .gte('created_at', cacheTimeWindow.toISOString())
        .order('published_at', { ascending: false })
        .limit(10);
      
      if (cachedNews && cachedNews.length > 0) {
        console.log('Returning cached news articles');
        return new Response(
          JSON.stringify({ articles: cachedNews }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // If no cached news or cache error, fetch from News API
      const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
      if (!NEWS_API_KEY) {
        console.error('NEWS_API_KEY not configured');
        return new Response(
          JSON.stringify({ error: 'News API key not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Prepare category mapping for News API
      const categoryMapping: Record<string, string> = {
        'general': 'general',
        'business': 'business',
        'technology': 'technology',
        'entertainment': 'entertainment',
        'health': 'health',
        'science': 'science',
        'sports': 'sports',
        'upsc': 'general', // Map exam categories to general news
        'psc': 'general',
        'ssc': 'general',
        'banking': 'business', // Banking exams get business news
      };
      
      const newsCategory = categoryMapping[category.toLowerCase()] || 'general';
      
      try {
        const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=in&category=${newsCategory}&apiKey=${NEWS_API_KEY}`;
        const newsResponse = await fetch(newsApiUrl);
        const newsData = await newsResponse.json();
        
        if (!newsResponse.ok) {
          throw new Error(newsData.message || 'Failed to fetch news');
        }
        
        if (newsData.articles && newsData.articles.length > 0) {
          // Store articles in the database for caching
          const articlesToInsert = newsData.articles.map((article: any) => ({
            title: article.title || 'No Title',
            description: article.description || '',
            url: article.url || '',
            image_url: article.urlToImage || '',
            published_at: article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString(),
            source: article.source?.name || '',
            category: category.toLowerCase()
          }));
          
          // Insert articles for caching
          const { error: insertError } = await supabase
            .from('news_articles')
            .insert(articlesToInsert);
            
          if (insertError) {
            console.error('Error caching news articles:', insertError);
          }
          
          return new Response(
            JSON.stringify({ articles: articlesToInsert }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ articles: [], message: 'No news articles found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fetchError) {
        console.error('Error fetching from News API:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch news articles' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action specified' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in news-feed function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
