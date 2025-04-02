
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsRequestParams {
  action: string;
  category?: string;
  query?: string;
  country?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  try {
    // Create a Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get News API key from settings
    const { data: keyData, error: keyError } = await supabaseAdmin
      .rpc('get_setting_value', { setting_key: 'NEWS_API_KEY' });
    
    if (keyError) {
      console.error('Error getting NEWS_API_KEY:', keyError);
      throw new Error('Unable to retrieve API key');
    }
    
    const NEWS_API_KEY = keyData || '7c64a4f4675a425ebe9fc4895fc6e273'; // Use default if not found
    
    // Parse request
    const params: NewsRequestParams = await req.json();
    const { action, category = 'general', query, country = 'in' } = params;
    
    if (action === 'get-news') {
      let apiUrl: string;
      
      if (query) {
        // Everything endpoint for custom queries
        const date = new Date();
        date.setDate(date.getDate() - 7); // Last 7 days
        const fromDate = date.toISOString().split('T')[0];
        
        apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromDate}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}`;
      } else {
        // Top headlines by category
        apiUrl = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${NEWS_API_KEY}`;
      }
      
      // Fetch news from external API
      const response = await fetch(apiUrl);
      const newsData = await response.json();
      
      if (newsData.status !== 'ok') {
        throw new Error(newsData.message || 'Failed to fetch news');
      }
      
      return new Response(
        JSON.stringify({
          status: 'success',
          articles: newsData.articles || []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('News-feed function error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message || 'An unexpected error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
