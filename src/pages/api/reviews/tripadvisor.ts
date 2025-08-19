import type { APIRoute } from 'astro';

export const prerender = false;

interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  date: string;
  platform: 'tripadvisor';
}

interface ReviewsResponse {
  reviews: Review[];
  rating: number;
  totalReviews: number;
}

// Mock TripAdvisor reviews data
const mockReviews: Review[] = [
  {
    id: 'ta_001',
    rating: 5,
    text: 'Absolutely fantastic caravan park! The facilities are spotless and the location is perfect for dog walking. The owners are incredibly welcoming and helpful. We\'ll definitely be back!',
    author: 'Sarah M.',
    date: '2024-01-15',
    platform: 'tripadvisor'
  },
  {
    id: 'ta_002',
    rating: 5,
    text: 'A hidden gem in Cheshire! Beautiful, peaceful location with excellent facilities. Our dogs loved the walking areas and we enjoyed the luxury amenities. Highly recommended for a relaxing break.',
    author: 'John & Emma T.',
    date: '2024-01-08',
    platform: 'tripadvisor'
  },
  {
    id: 'ta_003',
    rating: 4,
    text: 'Great caravan park with top-notch facilities. The shower blocks are immaculate and the laundry facilities are very convenient. Perfect for families with pets.',
    author: 'Mike R.',
    date: '2023-12-22',
    platform: 'tripadvisor'
  },
  {
    id: 'ta_004',
    rating: 5,
    text: 'Outstanding caravan park! The attention to detail in the facilities is impressive. The dog walking areas are extensive and well-maintained. We felt very welcome throughout our stay.',
    author: 'Lisa & David K.',
    date: '2023-12-18',
    platform: 'tripadvisor'
  }
];

export const GET: APIRoute = async () => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate overall rating
    const totalRating = mockReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / mockReviews.length) * 10) / 10;
    
    const response: ReviewsResponse = {
      reviews: mockReviews.slice(0, 4), // Return latest 4 reviews
      rating: averageRating,
      totalReviews: 127 // Mock total review count
    };
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );
    
  } catch (error) {
    console.error('TripAdvisor API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch reviews',
        reviews: [],
        rating: 0,
        totalReviews: 0
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};