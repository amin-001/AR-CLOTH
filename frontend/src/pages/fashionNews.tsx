

/**
 * FashionNews Component
 *
 * This component displays a curated feed of fashion news articles with infinite scrolling.
 * It fetches articles from a backend API and provides features like:
 * - Article browsing with images and metadata
 * - Bookmarking and liking functionality
 * - Modal view for full article reading
 * - Topic filtering and subscription options
 * - Responsive grid layout for different screen sizes
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getNews } from '@/http/api';
import { toast } from '@/hooks/use-toast';
import { LineWave } from "react-loader-spinner";
import { useInfiniteQuery } from '@tanstack/react-query';

// Type definition for article data
type Article = {
    id: string;
    title: string;
    image: string;
    tags: string[];
    excerpt: string;
    author: string;
    date: string;
    content?: string;
};

// const ARTICLES: Article[] = [
//     {
//         id: 'a1',
//         title: 'Sculpted Silhouettes: Fall 2025 Trends',
//         image: '/assets/storyImg1.png',
//         tags: ['Runway', 'Fall 2025', 'Silhouettes'],
//         excerpt: 'Designers are experimenting with bold contours and architectural tailoring for a refined yet experimental fall palette.',
//         author: 'A. Monroe',
//         date: 'Oct 10, 2025',
//     },
//     {
//         id: 'a2',
//         title: 'Sustainable Fabrics Making Waves',
//         image: '/assets/storyImg2.png',
//         tags: ['Sustainability', 'Materials'],
//         excerpt: 'New bio-based fibers and recycled blends are closing the gap between performance and planet-friendly fashion.',
//         author: 'K. Rivera',
//         date: 'Oct 8, 2025',
//     },
//     {
//         id: 'a3',
//         title: 'Streetwear to Smartwear: The Crossover',
//         image: '/assets/img-22.png',
//         tags: ['Streetwear', 'Tech'],
//         excerpt: 'Casual silhouettes are getting functional upgrades — hidden pockets, adaptable fits and tech-friendly fabrics.',
//         author: 'J. Patel',
//         date: 'Oct 5, 2025',
//     },
// ];

const FashionNews: React.FC = () => {
    // State for user interactions
    const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
    const [likes, setLikes] = useState<Record<string, number>>({});
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    // Pagination settings
    const PAGE_SIZE = 3;
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Infinite query for fetching news articles
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
        queryKey: ["news"],  // Unique key for caching
        queryFn: ({ pageParam }) => getNews({ page: pageParam, limit: PAGE_SIZE }),  // API call function
        initialPageParam: 1,  // Start from page 1
        getNextPageParam: (lastPage) => {
            // Determine if there are more pages to load
            return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
        },
        staleTime: 10 * 1000,  // Cache data for 10 seconds
    });

    const allNews = data?.pages.flatMap(page => page.news) || [];

    useEffect(() => {
        if (!loadMoreRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 1.0 }
        );
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 ">
            <LineWave
                visible={true}
                height="100"
                width="100"
                color="#cbd5e1"
                ariaLabel="line-wave-loading"
                wrapperStyle={{}}
                wrapperClass=""
                firstLineColor=""
                middleLineColor=""
                lastLineColor=""
            />
        </div>
    );
    if (isError) return <div>Failed to load news</div>;

    // User interaction handlers
    const toggleBookmark = (id: string) => {
        setBookmarks((s) => ({ ...s, [id]: !s[id] }));
    };

    const addLike = (id: string) => {
        setLikes((s) => ({ ...s, [id]: (s[id] || 0) + 1 }));
    };

    // Open article in modal view
    const openArticleModal = (article: any) => {
        setSelectedArticle({ ...article, content: article.content || article.excerpt + '\n\nFull article content would be loaded here. ' + article.excerpt });
    };

    // Close article modal
    const closeArticleModal = () => {
        setSelectedArticle(null);
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_25%)]" />
            <div className="relative mx-auto max-w-6xl p-6 pb-12">
            {/* Page header */}
            <header className="mb-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-8 shadow-[0_25px_45px_-20px_rgba(15,23,42,0.85)] backdrop-blur-xl">
                <h1 className="text-3xl font-bold text-white">Fashion News</h1>
                <p className="text-slate-300 mt-2">Curated updates — runway highlights, material innovations and street style trends.</p>
            </header>

            {/* Hero section with featured article */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden bg-slate-900/90 border border-slate-700/70 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
                        {/* Featured article image */}
                        <div className="relative h-64 bg-slate-950/80">
                            <img src={allNews[0]?.image} alt="hero" className="object-cover w-full h-full" />
                        </div>
                        <CardHeader>
                            <CardTitle>{allNews[0]?.title}</CardTitle>
                            <CardDescription>{allNews[0]?.excerpt}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-400">By {allNews[0]?.author} • {allNews[0]?.date}</p>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <div className="text-sm text-slate-400">By E. Laurent • Oct 12, 2025</div>
                            <div className="flex gap-2">
                                <Button variant="ghost">Share</Button>
                                <Button>Read More</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Sidebar with topics and subscription */}
                <aside className="space-y-4">
                    {/* Topics filter */}
                    <Card className="p-4 bg-slate-900/90 border border-slate-700/70 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
                        <h3 className="text-lg font-semibold text-white">Topics</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs">Runway</span>
                            <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs">Sustainability</span>
                            <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs">Tech</span>
                            <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs">Street</span>
                        </div>
                    </Card>

                    {/* Newsletter subscription */}
                    <Card className="p-4 bg-slate-900/90 border border-slate-700/70 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
                        <h3 className="text-lg font-semibold text-white">Subscribe</h3>
                        <p className="text-sm text-slate-300 mt-2">Get weekly highlights in your inbox.</p>
                        <div className="mt-3 flex gap-2">
                            <input className="flex-1 rounded-md border border-slate-700/70 bg-slate-950/80 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder="you@domain.com" />
                            <Button>Subscribe</Button>
                        </div>
                    </Card>
                </aside>
            </section>

            {/* Articles list section */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">Latest articles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Map through articles and render cards */}
                    {allNews.map((a:any) => (
                        <Card key={a.id} className="overflow-hidden flex flex-col cursor-pointer hover:shadow-2xl transition-shadow bg-slate-900/90 border border-slate-700/70 shadow-cyan-500/10" onClick={() => openArticleModal(a)}>
                            <div className="h-48 bg-slate-950/80">
                                <img src={a.image} alt={a.title} className="object-cover w-full h-full" />
                            </div>
                            <CardContent className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {a.tags.slice(0, 2).map((t:any) => (
                                            <span key={t} className="text-xs text-slate-400">#{t}</span>
                                        ))}
                                    </div>
                                    <div className="text-xs text-slate-400">{a.date}</div>
                                </div>
                                <CardTitle className="mt-3 text-lg text-white">{a.title}</CardTitle>
                                <p className="text-sm text-slate-300 mt-2">{a.excerpt}</p>
                            </CardContent>
                            <CardFooter className="justify-between" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-3">
                                    <Button  size="sm" onClick={(e) => { e.stopPropagation(); addLike(a.id); }}>Like • {likes[a.id] || 0}</Button>
                                    <Button variant={bookmarks[a.id] ? 'secondary' : 'outline'} size="sm" onClick={(e) => { e.stopPropagation(); toggleBookmark(a.id); }}>{bookmarks[a.id] ? 'Bookmarked' : 'Bookmark'}</Button>
                                </div>
                                <div className="text-sm text-slate-400">By {a.author}</div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                        <LineWave height="80" width="80" color="#cbd5e1" />
                    </div>
                )}
                {/* Invisible element for intersection observer to trigger loading */}
                <div ref={loadMoreRef} className="h-10" />
            </section>

            {/* Article modal for full reading */}
            {selectedArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <CardTitle className="text-2xl text-white">{selectedArticle.title}</CardTitle>
                                    <CardDescription className="mt-2">By {selectedArticle.author} • {selectedArticle.date}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={closeArticleModal}>✕</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Article image */}
                            <div className="mb-4 h-64 bg-slate-950/80 rounded-lg overflow-hidden">
                                <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                            </div>
                            {/* Article tags */}
                            <div className="flex gap-2 mb-4">
                                {selectedArticle.tags.map((t: any) => (
                                    <span key={t} className="px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs">{t}</span>
                                ))}
                            </div>
                            {/* Article content */}
                            <div className="prose prose-sm max-w-none">
                                <p className="text-slate-300 whitespace-pre-wrap leading-7">{selectedArticle.content}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            {/* Interaction buttons */}
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" onClick={() => addLike(selectedArticle.id)}>Like • {likes[selectedArticle.id] || 0}</Button>
                                <Button variant={bookmarks[selectedArticle.id] ? 'secondary' : 'outline'} onClick={() => toggleBookmark(selectedArticle.id)}>{bookmarks[selectedArticle.id] ? 'Bookmarked' : 'Bookmark'}</Button>
                            </div>
                            <Button variant="outline" onClick={closeArticleModal}>Close</Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
            </div>
        </div>
    );
};

export default FashionNews;