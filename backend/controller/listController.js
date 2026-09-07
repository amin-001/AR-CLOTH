/**
 * List Controller
 *
 * Handles data retrieval operations including:
 * - User/customer listings with pagination
 * - Fashion news articles
 * - Asset management and listings
 * - Search and filtering functionality
 */

import User from '../models/User.js';


// Get all customers with pagination
export const getAllCustomers = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Fetch users and total count in parallel
    const [Users, totalCount] = await Promise.all([
      User.find()
        .populate('user_id', '-password -__v') // Exclude sensitive fields
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    res.status(200).json({
      Users,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch customers', error: err.message });
  }
};

// Get all fashion news articles with pagination
export const getAllNews = async (req, res) => {
    try {
      // Static array of fashion news articles (in production, this would come from a database)
      // const newsArticles = [
//     {
//         id: 'a1',
//         title: 'Sculpted Silhouettes: Fall 2025 Trends',
//         image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmjS8ywMSOb3KUk39Ta5Ro3xb9yM6P8TLbdw&s',
//         tags: ['Runway', 'Fall 2025', 'Silhouettes'],
//         excerpt: 'Designers are experimenting with bold contours and architectural tailoring for a refined yet experimental fall palette.',
//         author: 'A. Monroe',
//         date: 'Oct 10, 2025',
//     },
//     {
//         id: 'a2',
//         title: 'Sustainable Fabrics Making Waves',
//         image: 'https://cdn.mos.cms.futurecdn.net/dNW6cGyEpY6sYDVAPsMdfc-1200-80.jpg',
//         tags: ['Sustainability', 'Materials'],
//         excerpt: 'New bio-based fibers and recycled blends are closing the gap between performance and planet-friendly fashion.',
//         author: 'K. Rivera',
//         date: 'Oct 8, 2025',
//     },
//     {
//         id: 'a3',
//         title: 'Streetwear to Smartwear: The Crossover',
//         image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSijZFQXQ0TOz8ETjBKPFptiVEzivBkk-i-FzW-gSf2fVzlaVA3gVILonwVsv9UY63v300&usqp=CAU',
//         tags: ['Streetwear', 'Tech'],
//         excerpt: 'Casual silhouettes are getting functional upgrades — hidden pockets, adaptable fits and tech-friendly fabrics.',
//         author: 'J. Patel',
//         date: 'Oct 5, 2025',
//     },
//     {
//         id: 'a4',
//         title: 'Color Forecast: Jewel Tones Dominate',
//         image: 'https://xmondohair.com/cdn/shop/files/sapphire-1.png?v=1752528368&width=533',
//         tags: ['Colors', 'Jewel Tones'],
//         excerpt: 'Emerald greens, sapphire blues and ruby reds are making a statement on runways and retail racks alike.',
//     },
//     {        
//         id: 'a5',
//         title: 'Accessory Spotlight: Statement Belts',
//         image: 'https://xmondohair.com/cdn/shop/articles/FallColorTrends_Blog_HorizontalHeader.png?v=1755537684&width=1100',
//         tags: ['Accessories', 'Belts'],
//         excerpt: 'Oversized buckles and intricate designs are elevating belts from functional to fashionable.',

//     },
//     {
//         id: 'a6',
//         title: 'Footwear Focus: Chunky Soles Return',
//         image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLfTYdxJWQ-2TjxRpRCDX5BjWSq9UDlm2S6g&s',
//         tags: ['Footwear', 'Trends'],
//         excerpt: 'The chunky sole trend is back with a vengeance, blending comfort with bold style statements.',
//     },
//     {
//         id: 'a7',
//         title: 'Layering Techniques for Transitional Weather',
//         image: 'https://www.anveya.com/cdn/shop/articles/shutterstock_1406948663.webp?v=1685427504',
//         tags: ['Layering', 'Weather'],
//         excerpt: 'Master the art of layering with versatile pieces that adapt to fluctuating temperatures and styles.',
//     }
// ];

    const newsArticles = [
      {
        id: 'a1',
        title: 'Sculpted Silhouettes: Fall 2025 Trends',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmjS8ywMSOb3KUk39Ta5Ro3xb9yM6P8TLbdw&s',
        tags: ['Runway', 'Fall 2025', 'Silhouettes'],
        excerpt: 'Designers are experimenting with bold contours and architectural tailoring for a refined yet experimental fall palette.',
        author: 'A. Monroe',
        date: 'Oct 10, 2025',
      },
      {
        id: 'a2',
        title: 'Sustainable Fabrics Making Waves',
        image: 'https://cdn.mos.cms.futurecdn.net/dNW6cGyEpY6sYDVAPsMdfc-1200-80.jpg',
        tags: ['Sustainability', 'Materials'],
        excerpt: 'New bio-based fibers and recycled blends are closing the gap between performance and planet-friendly fashion.',
        author: 'K. Rivera',
        date: 'Oct 8, 2025',
      },
      {
        id: 'a3',
        title: 'Streetwear to Smartwear: The Crossover',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSijZFQXQ0TOz8ETjBKPFptiVEzivBkk-i-FzW-gSf2fVzlaVA3gVILonwVsv9UY63v300&usqp=CAU',
        tags: ['Streetwear', 'Tech'],
        excerpt: 'Casual silhouettes are getting functional upgrades — hidden pockets, adaptable fits and tech-friendly fabrics.',
        author: 'J. Patel',
        date: 'Oct 5, 2025',
      },
      {
        id: 'a4',
        title: 'Color Forecast: Jewel Tones Dominate',
        image: 'https://xmondohair.com/cdn/shop/files/sapphire-1.png?v=1752528368&width=533',
        tags: ['Colors', 'Jewel Tones'],
        excerpt: 'Emerald greens, sapphire blues and ruby reds are making a statement on runways and retail racks alike.',
      },
      {        
        id: 'a5',
        title: 'Accessory Spotlight: Statement Belts',
        image: 'https://xmondohair.com/cdn/shop/articles/FallColorTrends_Blog_HorizontalHeader.png?v=1755537684&width=1100',
        tags: ['Accessories', 'Belts'],
        excerpt: 'Oversized buckles and intricate designs are elevating belts from functional to fashionable.',
      },
      {
        id: 'a6',
        title: 'Footwear Focus: Chunky Soles Return',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLfTYdxJWQ-2TjxRpRCDX5BjWSq9UDlm2S6g&s',
        tags: ['Footwear', 'Trends'],
        excerpt: 'The chunky sole trend is back with a vengeance, blending comfort with bold style statements.',
      },
      {
        id: 'a7',
        title: 'Layering Techniques for Transitional Weather',
        image: 'https://www.anveya.com/cdn/shop/articles/shutterstock_1406948663.webp?v=1685427504',
        tags: ['Layering', 'Weather'],
        excerpt: 'Master the art of layering with versatile pieces that adapt to fluctuating temperatures and styles.',
      },

      // ------------------ NEW ITEMS START HERE ------------------ //

      {
        id: 'a8',
        title: 'Metallic Finishes Shine on Spring Runways',
        image: 'https://assets.vogue.com/photos/61e9c43c8aa98afba69ec2e8/master/w_1600,c_limit/00_story.jpg',
        tags: ['Runway', 'Spring 2025', 'Metallics'],
        excerpt: 'Gold, chrome and iridescent fabrics are returning with futuristic flair.',
        author: 'L. Hart',
        date: 'Sep 30, 2025',
      },
      {
        id: 'a9',
        title: 'Minimalist Chic Makes a Comeback',
        image: 'https://www.carlton-photography.co.uk/wp-content/uploads/2020/09/lifestyle-mens-fashion-in-manchester.jpg',
        tags: ['Minimalism', 'Trends'],
        excerpt: 'Clean lines and neutral palettes are becoming the go-to choice for effortless elegance.',
        author: 'T. James',
        date: 'Sep 25, 2025',
      },
      {
        id: 'a10',
        title: 'Denim Deconstruction Takes Center Stage',
        image: 'https://jetsettimes.com/wp-content/uploads/2022/07/Style-File-The-5-Pieces-Every-Fashion-Forward-Woman-Has-.png',
        tags: ['Denim', 'Streetwear'],
        excerpt: 'Patchwork, frayed seams and asymmetric cuts redefine modern denim.',
      },
      {
        id: 'a11',
        title: 'Knitwear Innovations for Winter Warmth',
        image: 'https://www.iconicindia.com/cdn/shop/articles/Fashion_Latest_Trends.png?v=1693421003',
        tags: ['Knitwear', 'Winter'],
        excerpt: 'Hybrid yarns and intricate weaves offer warmth without bulk.',
      },
      {
        id: 'a12',
        title: 'Bold Prints Dominate Resort 2026',
        image: 'https://fashionista.com/.image/c_limit%2Ccs_srgb%2Cq_auto:good%2Cw_700/MTcwNjk1NzQ2NjU0MzE1Nzgy/milan-fashion-week-fall-2020-best-street-style.webp',
        tags: ['Resort', 'Prints'],
        excerpt: 'Vibrant patterns inspired by nature and travel are leading the resort season.',
      },
      {
        id: 'a13',
        title: 'Tech-Integrated Jackets Hit the Market',
        image: 'https://images.squarespace-cdn.com/content/v1/565506d5e4b05e0c71a09a2d/1565113258589-Q4F4YOMTA4J6XJ3OJ8PJ/Screen+Shot+2018-01-23+at+5.55.07+PM.png?format=1500w',
        tags: ['Tech', 'Outerwear'],
        excerpt: 'Smart jackets now feature temperature regulation and embedded sensors.',
      },
      {
        id: 'a14',
        title: 'Retro Revival: 70s Aesthetic Returns',
        image: 'https://media.gq-magazine.co.uk/photos/5d13ac713b3853f4b90e9b1e/16:9/w_1600,c_limit/ss-03-gq-10sep18_b.jpg',
        tags: ['Retro', '1970s'],
        excerpt: 'Bell-bottoms, earthy hues and statement collars are trending again.',
      },
      {
        id: 'a15',
        title: 'Upcycled Accessories Gain Popularity',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxuUzXojJYTiQvRmNTukTTIYkmCChJjXfkow&s',
        tags: ['Sustainability', 'Accessories'],
        excerpt: 'Designers are transforming waste materials into luxury-grade accessories.',
      },
      {
        id: 'a16',
        title: 'Evening Wear Embraces Feather Details',
        image: 'https://9f8e62d4.delivery.rocketcdn.me/wp-content/uploads/2025/03/mens-90s-style.jpg',
        tags: ['Evening Wear', 'Trends'],
        excerpt: 'Soft feather trims bring movement and drama to red-carpet looks.',
      },
      {
        id: 'a17',
        title: 'Soft Pastels Take Over Spring Collections',
        image: 'https://cdn.shopify.com/s/files/1/2378/2395/files/Key_Questions_About_Influential_Fashion_Trends_for_Women_in_2023_480x480.jpg?v=1686557123',
        tags: ['Colors', 'Spring'],
        excerpt: 'Designers gravitate toward lavender, blush and mint tones for gentle sophistication.',
      },
      {
        id: 'a18',
        title: 'Menswear Sees Rise in Wide-Leg Trousers',
        image: 'https://media.istockphoto.com/id/1428994315/photo/smiling-woman-outdoor-portrait-short-blonde-hair-fashion-model-wears-stylish-clothes-double.jpg?s=612x612&w=0&k=20&c=NWemwMvwX5nHte3jGH1jj_EeHUW8RMebuiFjbdm7G5Y=',
        tags: ['Menswear', 'Trends'],
        excerpt: 'Relaxed silhouettes dominate menswear, offering comfort and style.',
      },
      {
        id: 'a19',
        title: 'Luxury Brands Embrace Digital Runways',
        image: 'https://www.japanbuzz.info/wp-content/uploads/2018/04/Japanese_Fashion_Influencers_Tribes.jpg',
        tags: ['Digital Fashion', 'Runway'],
        excerpt: 'High-end labels experiment with VR catwalks and immersive presentations.',
      },
      {
        id: 'a20',
        title: 'Floral Embroidery Makes a Delicate Return',
        image: 'https://assets.vogue.com/photos/65b27a7197f83442a161aea9/master/w_1600,c_limit/VO0324_Designers_22.jpg',
        tags: ['Embroidery', 'Trends'],
        excerpt: 'Hand-stitched blooms elevate dresses, blouses and accessories.',
      },
      {
        id: 'a21',
        title: 'Athleisure Gets a Tailored Upgrade',
        image: 'https://plus.unsplash.com/premium_photo-1671198905435-20f8d166efb2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        tags: ['Athleisure', 'Tailoring'],
        excerpt: 'Structured joggers and blazer-matching hoodies bridge comfort and refinement.',
      },
      {
        id: 'a22',
        title: 'Eco-Dyes Offer Vibrant New Palettes',
        image: 'https://stylegirlfriend.com/wp-content/uploads/2024/11/winter-style-2024.jpg',
        tags: ['Sustainability', 'Materials'],
        excerpt: 'Natural dyeing methods now rival synthetic colors in vibrancy and longevity.',
      },
      {
        id: 'a23',
        title: 'Winter Coats Trend Toward Maxi Lengths',
        image: 'https://media.gq-magazine.co.uk/photos/5f11c9505c7c349fdae82d51/16:9/w_1920,h_1080,c_limit/20200717-roundup-trends-13.jpg',
        tags: ['Outerwear', 'Winter'],
        excerpt: 'Full-length silhouettes offer drama and improved insulation.',
      },
      {
        id: 'a24',
        title: 'Statement Earrings Reclaim the Spotlight',
        image: 'https://as1.ftcdn.net/v2/jpg/01/56/89/60/1000_F_156896021_yCTTXnnYBXto4qX3c0MuHYaQ8KENwu2l.jpg',
        tags: ['Accessories', 'Jewelry'],
        excerpt: 'Sculptural metals and oversized gems dominate earring trends.',
      },
      {
        id: 'a25',
        title: 'Sheer Layers Add a Touch of Mystery',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOXkVGPy6DcsvP2a0bYuXbSyQWiGfi9L4xow&s',
        tags: ['Layering', 'Runway'],
        excerpt: 'Transparent overlays play with depth and light for ethereal looks.',
      },
      {
        id: 'a26',
        title: 'Utilitarian Pockets Are Back in Style',
        image: 'https://as1.ftcdn.net/v2/jpg/04/01/34/48/1000_F_401344894_1acbpU9HYknxCvJud2hH3lAamnmElbdc.jpg',
        tags: ['Utility', 'Streetwear'],
        excerpt: 'Cargo elements appear across skirts, jackets and trousers.',
      },
      {
        id: 'a27',
        title: 'Faux Fur Innovations Mimic Real Texture',
        image: 'https://as1.ftcdn.net/v2/jpg/03/12/76/92/1000_F_312769290_7xJPwe1vgnTbrjmA7aRLduzSf0PcCdDA.jpg',
        tags: ['Faux Fur', 'Winter'],
        excerpt: 'Next-gen materials offer ethical luxury with remarkable softness.',
      },
      {
        id: 'a28',
        title: 'Neon Accents Electrify Fall Outfits',
        image: 'https://as1.ftcdn.net/v2/jpg/04/68/47/52/1000_F_468475205_c6NijcwOaVBUCUwICO2GT1PdituNHd2o.jpg',
        tags: ['Colors', 'Fall'],
        excerpt: 'Pops of neon contrast with muted layers for dynamic styling.',
      },
      {
        id: 'a29',
        title: 'Ballet-Inspired Fashion Gains Momentum',
        image: 'https://as1.ftcdn.net/v2/jpg/04/24/41/48/1000_F_424414852_YNxUqj5Wk0kNjnrNtKfQyduRN5bLLSqk.jpg',
        tags: ['Balletcore', 'Trends'],
        excerpt: 'Soft tulle, wrap sweaters and satin shoes define the balletcore movement.',
      },
      {
        id: 'a30',
        title: 'The Rise of Monochrome Power Dressing',
        image: 'https://as2.ftcdn.net/v2/jpg/02/66/27/27/1000_F_266272736_JqAyqk4q5GEM6M6kiX2s1UT0h63iw4q5.jpg',
        tags: ['Monochrome', 'Power Dressing'],
        excerpt: 'Head-to-toe tonal outfits communicate confidence and clarity.',
      }
    ];

      // Handle pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;
      const totalCount = newsArticles.length;
      const paginatedNews = newsArticles.slice(skip, skip + limit);

      res.status(200).json({
        news: paginatedNews,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch news articles', error: err.message });
    }
  };