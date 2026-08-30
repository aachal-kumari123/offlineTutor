import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import {
  HiOutlineAcademicCap,
  HiOutlineLocationMarker,
  HiOutlineCurrencyRupee,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePause,
  HiOutlinePlay,
} from 'react-icons/hi';

const slides = [
  {
    title: 'Find Expert Offline Tutors Near You',
    subtitle: 'Connect with verified teachers in your city for personalized home tuition.',
    cta: 'Browse Teachers',
    link: '/teachers',
    gradient: 'from-slate-950 via-primary-800 to-primary-600',
    eyebrow: 'A better way to learn',
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1800&q=85',
    icon: <HiOutlineAcademicCap className="w-16 h-16 text-white/90" />,
  },
  {
    title: 'Learn at Your Own Pace, In Person',
    subtitle: 'Mathematics, Science, Languages, Competitive Exams — find the perfect match.',
    cta: 'Get Started',
    link: '/login?mode=signup',
    gradient: 'from-slate-900 via-cyan-900 to-teal-700',
    eyebrow: 'Personalized learning, nearby',
    image:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=85',
    icon: <HiOutlineLocationMarker className="w-16 h-16 text-white/90" />,
  },
  {
    title: 'Affordable Fees • Flexible Timings',
    subtitle: 'Filter by subject, location, experience and hourly rates that suit your budget.',
    cta: 'Explore Now',
    link: '/teachers',
    gradient: 'from-slate-950 via-amber-800 to-primary-700',
    eyebrow: 'Your goals. Your schedule.',
    image:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1800&q=85',
    icon: <HiOutlineCurrencyRupee className="w-16 h-16 text-white/90" />,
  },
];

const HeroSlider = () => {
  const [swiper, setSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleAutoplay = () => {
    if (!swiper) return;
    if (isPlaying) swiper.autoplay.stop();
    else swiper.autoplay.start();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative group">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, el: '.hero-pagination' }}
        onSwiper={setSwiper}
        onSlideChange={(instance) => setActiveIndex(instance.realIndex)}
        className="h-[460px] md:h-[520px] rounded-2xl overflow-hidden shadow-2xl"
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <div
              className={`h-full w-full bg-gradient-to-br ${slide.gradient} flex items-center relative overflow-hidden`}
            >
              <img
                src={slide.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover mix-blend-luminosity opacity-50 transition-transform duration-[7000ms] ease-out scale-105 swiper-slide-active:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-primary-900/20" />

              <div className="max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                <div className="text-white max-w-xl space-y-5 animate-slide-up">
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-white/80">
                    <span className="w-8 h-px bg-accent-400" />
                    {slide.eyebrow}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 leading-relaxed">{slide.subtitle}</p>
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    {slide.cta}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
                <div className="hidden md:flex items-center justify-center opacity-90">{slide.icon}</div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute left-6 md:left-12 bottom-6 z-20 flex items-center gap-3 text-white">
        <span className="text-sm font-semibold tabular-nums">0{activeIndex + 1}</span>
        <div className="h-px w-12 bg-white/50" />
        <span className="text-sm text-white/70 tabular-nums">0{slides.length}</span>
      </div>

      <div className="absolute right-6 md:right-12 bottom-5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => swiper?.slidePrev()}
          className="rounded-full bg-black/25 p-2.5 text-white backdrop-blur-sm transition hover:bg-white hover:text-slate-900"
          aria-label="Previous slide"
        >
          <HiOutlineChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={toggleAutoplay}
          className="rounded-full bg-black/25 p-2.5 text-white backdrop-blur-sm transition hover:bg-white hover:text-slate-900"
          aria-label={isPlaying ? 'Pause slides' : 'Play slides'}
        >
          {isPlaying ? <HiOutlinePause className="h-5 w-5" /> : <HiOutlinePlay className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => swiper?.slideNext()}
          className="rounded-full bg-black/25 p-2.5 text-white backdrop-blur-sm transition hover:bg-white hover:text-slate-900"
          aria-label="Next slide"
        >
          <HiOutlineChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="hero-pagination absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 gap-1.5" />
    </div>
  );
};

export default HeroSlider;
