import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';

// Generate test auctions for seeding
const generateSeedAuctions = (userId: string) => {
  const categories = ["Electronics", "Collectibles", "Fashion", "Art", "Home"];
  const conditions = ["New", "Like New", "Excellent", "Good", "Fair"];
  const names = ["Vintage Camera", "Gaming Console", "Antique Watch", "Designer Bag", "Rare Painting"];
  
  return Array.from({ length: 5 }, (_, i) => ({
    title: `${names[i]}`,
    description: `This is a seed auction for ${names[i]}.`,
    starting_price: 50 + Math.floor(Math.random() * 950),
    category: categories[i % categories.length],
    condition: conditions[i % conditions.length],
    end_time: new Date(Date.now() + 86400000 * (1 + Math.floor(Math.random() * 14))).toISOString(), // 1-14 days
    images: ["/placeholder.svg"],
    user_id: userId,
    status: 'active',
    start_time: new Date().toISOString()
  }));
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if auctions table exists
    try {
      const { data: tableExists, error: tableCheckError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'auctions')
        .eq('table_schema', 'public')
        .single();
      
      if (tableCheckError) {
        console.error('Error checking table existence:', tableCheckError);
        return NextResponse.json({ error: tableCheckError.message }, { status: 500 });
      }
      
      let message = 'Supabase tables status:';
      
      if (!tableExists) {
        message += ' Auctions table does not exist. Creating...';
        
        // Create the auctions table (this would typically be done via migrations)
        // This is a simplified version - in production you'd use proper migrations
        const { error: createError } = await supabase.rpc('create_auctions_table');
        
        if (createError) {
          console.error('Error creating auctions table:', createError);
          message += ` Error: ${createError.message}`;
        } else {
          message += ' Table created successfully!';
        }
      } else {
        message += ' Auctions table exists.';
      }
      
      // Check if there is row level security policy
      const { data: rls, error: rlsError } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('table_name', 'auctions');
      
      if (rlsError) {
        console.error('Error checking RLS policies:', rlsError);
        message += ` Error checking RLS: ${rlsError.message}`;
      } else {
        message += ` Found ${rls.length} RLS policies.`;
      }
      
      // Check number of records in auctions table
      const { count, error: countError } = await supabase
        .from('auctions')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting auctions:', countError);
        message += ` Error counting auctions: ${countError.message}`;
      } else {
        message += ` Found ${count} auction records.`;
        
        // If no auctions exist, seed the database with some test auctions
        if (count === 0) {
          message += ' Attempting to seed database with test auctions...';
          
          try {
            // Get the current authenticated user 
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
              message += ' Error: No authenticated user found for seeding.';
            } else {
              // Create seed auctions
              const seedAuctions = generateSeedAuctions(user.id);
              const { data: seedData, error: seedError } = await supabase
                .from('auctions')
                .insert(seedAuctions)
                .select();
              
              if (seedError) {
                console.error('Error seeding auctions:', seedError);
                message += ` Error seeding: ${seedError.message}`;
              } else {
                message += ` Successfully seeded ${seedData.length} auctions.`;
              }
            }
          } catch (authError) {
            console.error('Auth error during seeding:', authError);
            message += ' Auth error during seeding. User may not be authenticated.';
          }
        }
      }
      
      return NextResponse.json({ 
        message,
        tableExists: !!tableExists,
        rlsPolicies: rls || [],
        auctionCount: count || 0
      });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json({ 
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        message: 'Could not check database status due to an error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error in init route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown server error' 
    }, { status: 500 });
  }
} 