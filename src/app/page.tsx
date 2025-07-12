'use client';

import { useEffect, useState, Suspense } from 'react';
import CapsuleSwitch from '@/components/CapsuleSwitch';
import ContinueWatching from '@/components/ContinueWatching';
import PageLayout from '@/components/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';
import VideoCard from '@/components/VideoCard';
import { useSite } from '@/components/SiteProvider';
import {
  clearAllFavorites,
  getAllFavorites,
  getAllPlayRecords,
} from '@/lib/db.client';

function HomeClient() {
  const [activeTab, setActiveTab] = useState<'home' | 'favorites'>('home');
  const [recommendList, setRecommendList] = useState<any[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const { announcement } = useSite();

  useEffect(() => {
    if (typeof window !== 'undefined' && announcement) {
      const seen = localStorage.getItem('hasSeenAnnouncement');
      if (seen !== announcement) {
        setShowAnnouncement(true);
      }
    }
  }, [announcement]);

  useEffect(() => {
    const fetchRecommend = async () => {
      try {
        const res = await fetch(
          'https://wolongzyw.com/api.php/provide/vod?order=hits&page=1'
        );
        const data = await res.json();
        setRecommendList(data.list || []);
      } catch (err) {
        console.error('推荐加载失败:', err);
      }
    };
    fetchRecommend();
  }, []);

  type FavoriteItem = {
    id: string;
    source: string;
    title: string;
    poster: string;
    episodes: number;
    source_name: string;
    currentEpisode?: number;
    search_title?: string;
  };

  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    if (activeTab !== 'favorites') return;
    (async () => {
      const [favorites, records] = await Promise.all([
        getAllFavorites(),
        getAllPlayRecords(),
      ]);

      const sorted = Object.entries(favorites)
        .sort(([, a], [, b]) => b.save_time - a.save_time)
        .map(([key, fav]) => {
          const plus = key.indexOf('+');
          const source = key.slice(0, plus);
          const id = key.slice(plus + 1);
          const playRecord = records[key];
          const currentEpisode = playRecord?.index;
          return {
            id,
            source,
            title: fav.title,
            poster: fav.cover,
            episodes: fav.total_episodes,
            source_name: fav.source_name,
            currentEpisode,
            search_title: fav.search_title,
          };
        });
      setFavoriteItems(sorted);
    })();
  }, [activeTab]);

  const handleCloseAnnouncement = (message: string) => {
    setShowAnnouncement(false);
    localStorage.setItem('hasSeenAnnouncement', message);
  };

  return (
    <PageLayout>
      <div className='px-2 sm:px-10 py-4 sm:py-8 overflow-visible'>
        {/* 顶部标签切换 */}
        <div className='mb-8 flex justify-center'>
          <CapsuleSwitch
            options={[
              { label: '首页', value: 'home' },
              { label: '收藏夹', value: 'favorites' },
            ]}
            active={activeTab}
            onChange={(v) => setActiveTab(v as 'home' | 'favorites')}
          />
        </div>

        <div className='max-w-[95%] mx-auto'>
          {activeTab === 'favorites' ? (
            <section className='mb-8'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                  我的收藏
                </h2>
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
              <div className='grid grid-cols-3 gap-x-2 gap-y-14 sm:gap-y-20 px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8 sm:px-4'>
                {favoriteItems.map((item) => (
                  <div key={item.id + item.source} className='w-full'>
                    <VideoCard
                      query={item.search_title}
                      {...item}
                      from='favorite'
                    />
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

              {/* 最新上映 */}
              <section className='mb-8'>
                <div className='mb-4'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>最新上映</h2>
                </div>
                <ScrollableRow>
                  {recommendList.slice(0, 12).map((item, index) => (
                    <div key={index} className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'>
                      <VideoCard title={item.vod_name} poster={item.vod_pic} rate={item.vod_remarks} from='recommend' />
                    </div>
                  ))}
                </ScrollableRow>
              </section>

              {/* 动作片精选 */}
              <section className='mb-8'>
                <div className='mb-4'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>动作片精选</h2>
                </div>
                <ScrollableRow>
                  {recommendList
                    .filter(item => item.type_name === '动作片')
                    .slice(0, 12)
                    .map((item, index) => (
                      <div key={index} className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'>
                        <VideoCard title={item.vod_name} poster={item.vod_pic} rate={item.vod_remarks} from='recommend' />
                      </div>
                    ))}
                </ScrollableRow>
              </section>

              {/* 科幻片精选 */}
              <section className='mb-8'>
                <div className='mb-4'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>科幻片精选</h2>
                </div>
                <ScrollableRow>
                  {recommendList
                    .filter(item => item.type_name === '科幻片')
                    .slice(0, 12)
                    .map((item, index) => (
                      <div key={index} className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'>
                        <VideoCard title={item.vod_name} poster={item.vod_pic} rate={item.vod_remarks} from='recommend' />
                      </div>
                    ))}
                </ScrollableRow>
              </section>

              {/* 搞笑片精选 */}
              <section className='mb-8'>
                <div className='mb-4'>
                  <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>搞笑片精选</h2>
                </div>
                <ScrollableRow>
                  {recommendList
                    .filter(item => item.type_name === '喜剧片')
                    .slice(0, 12)
                    .map((item, index) => (
                      <div key={index} className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'>
                        <VideoCard title={item.vod_name} poster={item.vod_pic} rate={item.vod_remarks} from='recommend' />
                      </div>
                    ))}
                </ScrollableRow>
              </section>
            </>
          )}
        </div>

        {announcement && showAnnouncement && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70 p-4'>
            <div className='w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900'>
              <div className='flex justify-between items-start mb-4'>
                <h3 className='text-2xl font-bold text-gray-800 dark:text-white'>提示</h3>
                <button
                  onClick={() => handleCloseAnnouncement(announcement)}
                  className='text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text
