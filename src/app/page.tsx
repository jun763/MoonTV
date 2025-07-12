'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';

import {
  clearAllFavorites,
  getAllFavorites,
  getAllPlayRecords,
} from '@/lib/db.client';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import ContinueWatching from '@/components/ContinueWatching';
import PageLayout from '@/components/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';
import { useSite } from '@/components/SiteProvider';
import VideoCard from '@/components/VideoCard';

function HomeClient() {
  const [activeTab, setActiveTab] = useState<'home' | 'favorites'>('home');
  const [hotMovies, setHotMovies] = useState<any[]>([]);
  const [hotTvShows, setHotTvShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { announcement } = useSite();
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && announcement) {
      const hasSeen = localStorage.getItem('hasSeenAnnouncement');
      if (hasSeen !== announcement) {
        setShowAnnouncement(true);
      } else {
        setShowAnnouncement(Boolean(!hasSeen && announcement));
      }
    }
  }, [announcement]);

  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchWolongZYData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          'https://wolongzyw.com/api.php/provide/vod?order=hits&page=1'
        );
        const data = await res.json();
        const list: any[] = data.list || [];

        setHotMovies(list.filter(i => i.type_name === '电影').slice(0, 12));
        setHotTvShows(
          list.filter(i =>
            ['国产剧', '海外剧', '韩剧', '美剧', '日剧'].includes(i.type_name)
          ).slice(0, 12)
        );
      } catch (err) {
        console.error('热门内容加载失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWolongZYData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'favorites') return;
    (async () => {
      const [allFavorites, allPlayRecords] = await Promise.all([
        getAllFavorites(),
        getAllPlayRecords(),
      ]);

      const sorted = Object.entries(allFavorites)
        .sort(([, a], [, b]) => b.save_time - a.save_time)
        .map(([key, fav]) => {
          const plusIndex = key.indexOf('+');
          const source = key.slice(0, plusIndex);
          const id = key.slice(plusIndex + 1);
          const playRecord = allPlayRecords[key];
          const currentEpisode = playRecord?.index;
          return {
            id,
            source,
            title: fav.title,
            year: fav.year,
            poster: fav.cover,
            episodes: fav.total_episodes,
            source_name: fav.source_name,
            currentEpisode,
            search_title: fav?.search_title,
          };
        });
      setFavoriteItems(sorted);
    })();
  }, [activeTab]);

  const handleCloseAnnouncement = (announcement: string) => {
    setShowAnnouncement(false);
    localStorage.setItem('hasSeenAnnouncement', announcement);
  };

  return (
    <PageLayout>
      <div className='px-2 sm:px-10 py-4 sm:py-8 overflow-visible'>
        <div className='mb-8 flex justify-center'>
          <CapsuleSwitch
            options={[
              { label: '首页', value: 'home' },
              { label: '收藏夹', value: 'favorites' },
            ]}
            active={activeTab}
            onChange={(value) => setActiveTab(value as 'home' | 'favorites')}
          />
        </div>

        <div className='max-w-[95%] mx-auto'>
          {activeTab === 'favorites' ? (
            <section className='mb-8'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>我的收藏</h2>
                {favoriteItems.length > 0 && (
                  <button
                    className='text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    onClick={async () => {
                      await clearAllFavorites();
                      setFavoriteItems([]);
                    }}
                  >
                    清空
                  </button>
                )}
              </div>
              <div className='justify-start grid grid-cols-3 gap-x-2 gap-y-14 sm:gap-y-20 px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8 sm:px-4'>
                {favoriteItems.map((item) => (
                  <div key={item.id + item.source} className='w-full'>
                    <VideoCard query={item.search_title} {...item} from='favorite' />
                  </div>
                ))}
                {favoriteItems.length === 0 && (
                  <div className='col-span-full text-center text-gray-500 py-8 dark:text-gray-400'>
                    暂无收藏内容
                  </div>
                )}
              </div>
            </section>
          ) : (
            <>
              <ContinueWatching />

              <section className='mb-8'>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>热门电影</h2>
                  <Link
                    href='/search?type=movie'
                    className='flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  >
                    查看更多 <ChevronRight className='w-4 h-4 ml-1' />
                  </Link>
                </div>
                <ScrollableRow>
                  {loading
                    ? Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'>
                          <div className='relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-200 animate-pulse dark:bg-gray-800'></div>
                          <div className='mt-2 h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-800'></div>
                        </div>
                      ))
                    : hotMovies.map((movie, index) => (
                        <div key={index} className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'>
                          <VideoCard
                            from='search'
                            title={movie.vod_name}
                            poster={movie.vod_pic}
                            rate={movie.vod_remarks}
                          />
                        </div>
                      ))}
                </ScrollableRow>
              </section>

              <section className='mb-8'>
                <div className='mb-4 flex items-center justify-between'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>热门剧集</h2>
                  <Link
                    href='/search?type=tv'
                    className='flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  >
                    查看更多 <ChevronRight className='w-4 h-4 ml-1' />
                  </Link>
                </div>
                <ScrollableRow>
                  {loading
                    ? Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'>
                          <div className='relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-200 animate-pulse dark:bg-gray-800'></div>
                          <div className='mt-2 h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-800'></div>
                        </div>
                      ))
                    : hotTvShows.map((show, index) => (
                        <div key={index} className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'>
                          <VideoCard
                            from='search'
                            title={show.vod_name}
                            poster={show.vod_pic}
                            rate={show.vod_remarks}
                          />
                        </div>
                      ))}
                </ScrollableRow>
              </section>
            </>
          )}
        </div>
      </div
