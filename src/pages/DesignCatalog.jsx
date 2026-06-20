import React, { useState, useEffect, useMemo } from 'react';
import { getDesignsApi, getCategoriesApi } from '../Action/api';
import { Search, Filter, ArrowRight, Sparkles, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const DesignCatalog = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [selectedImage, setSelectedImage] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const getImageUrl = (path) => {
    if (!path) return '';
    const cleanPath = path.split(',')[0].trim().replace(/\\/g, '/');
    return `http://localhost:5000${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  const getImageUrls = (path) => {
    if (!path) return [];
    return path.split(',').map(p => {
      const cleanPath = p.trim().replace(/\\/g, '/');
      return `http://localhost:5000${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [designsRes, catRes] = await Promise.all([
        getDesignsApi(),
        getCategoriesApi()
      ]);
      setDesigns(designsRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load inspiration gallery');
    } finally {
      setLoading(false);
    }
  };

  const filteredDesigns = useMemo(() => {
    return designs.filter(design => {
      const matchesSearch = design.name.toLowerCase().includes(searchTerm.toLowerCase()) || design.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory !== 'all' ? design.categoryId === parseInt(selectedCategory) : true;
      return matchesSearch && matchesCategory;
    });
  }, [designs, searchTerm, selectedCategory]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Header Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-white dark:bg-dark-card p-10 md:p-14 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-dark-border text-center flex flex-col items-center justify-center mb-8"
      >
        {/* Subtle Decorative Backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-[#e2148d]/5 dark:from-primary-900/10 dark:to-pink-900/10"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-200/40 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#e2148d]/10 dark:bg-pink-900/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border shadow-sm text-[#e2148d] dark:text-primary-400 text-xs font-bold mb-6 uppercase tracking-wider"
          >
            <Sparkles size={14} className="text-[#e2148d]" />
            <span>Curated Collections</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-semibold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              Design <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-[#e2148d]">Lookbook</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 dark:text-slate-400 text-base md:text-lg mb-6 max-w-2xl mx-auto leading-relaxed"
          >
            Explore our exclusive gallery of stunning, trend-setting designs. Find the perfect inspiration for your next collection.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-xl relative flex items-center group shadow-xl shadow-slate-200/50 dark:shadow-none rounded-full"
          >
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="text-slate-400 group-focus-within:text-[#e2148d] transition-colors" size={22} />
            </div>
            <input
              type="text"
              placeholder="Search by design name, category, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-dark-bg border-2 border-slate-200 dark:border-dark-border text-slate-800 dark:text-white placeholder:text-slate-400 rounded-full py-4 md:py-4 pl-14 pr-6 outline-none focus:border-[#e2148d] focus:ring-4 focus:ring-[#e2148d]/10 dark:focus:ring-primary-500/20 transition-all duration-300 text-base md:text-lg"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Categories Filter (Pills) */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === 'all'
            ? 'bg-[#e2148d] text-white shadow-lg shadow-[#e2148d]/30 dark:bg-[#e2148d] dark:shadow-[#e2148d]/30'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-dark-card dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-bg'
            }`}
        >
          All Inspirations
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id.toString())}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === c.id.toString()
              ? 'bg-[#e2148d] text-white shadow-lg shadow-[#e2148d]/30 dark:bg-[#e2148d] dark:shadow-[#e2148d]/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-dark-card dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-bg'
              }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p>Curating inspiration...</p>
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-dark-bg rounded-full flex items-center justify-center mb-6">
            <ImageIcon size={32} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No inspiration found</h3>
          <p className="text-slate-500 max-w-md">Try adjusting your search terms or selecting a different category to find what you're looking for.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
            className="mt-6 px-6 py-2 bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-2">
          {filteredDesigns.map((design, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 % 0.3 }}
              key={design.id}
              onClick={() => navigate(`/buyer/product/${design.id}`)}
              className="relative group rounded-2xl overflow-hidden bg-slate-100 dark:bg-dark-bg cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-200/50 dark:border-dark-border"
            >
              {getImageUrl(design.image) ? (
                <img
                  src={getImageUrl(design.image)}
                  alt={design.name}
                  className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[4/5] flex items-center justify-center text-slate-400">
                  <ImageIcon size={48} className="opacity-20" />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-primary-300 text-xs font-semibold uppercase tracking-wider mb-2 block">
                    {design.category?.name || 'Design'}
                  </span>
                  <h3 className="text-white text-xl font-semibold mb-1 leading-tight">{design.name}</h3>
                  <p className="text-slate-300 text-sm font-mono mb-6">{design.code}</p>

                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(design);
                        setCurrentSlideIndex(0);
                      }}
                      className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex justify-center items-center"
                    >
                      Quick View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/buyer/product/${design.id}`);
                      }}
                      className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex justify-center items-center shadow-lg shadow-primary-600/30"
                    >
                      Buy Now <ArrowRight size={16} className="ml-1.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick View Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed modal_main inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setSelectedImage(null)}></div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] bg-white dark:bg-dark-card rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-200 dark:border-dark-border"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 dark:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              <div className="md:w-3/5 bg-slate-100 dark:bg-dark-bg flex items-center justify-center relative group p-6">
                {(() => {
                  const images = getImageUrls(selectedImage.image);
                  return (
                    <>
                      {images.length > 0 && (
                        <img
                          src={images[currentSlideIndex]}
                          alt={selectedImage.name}
                          className="max-w-full max-h-[50vh] md:max-h-[85vh] object-contain drop-shadow-2xl transition-opacity duration-300"
                        />
                      )}

                      {images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSlideIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/50 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 dark:text-white transition-colors z-10"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentSlideIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/50 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 dark:text-white transition-colors z-10"
                          >
                            <ChevronRight size={24} />
                          </button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(idx); }}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlideIndex ? 'bg-primary-600 scale-125' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="md:w-2/5 p-8 flex flex-col justify-center bg-white dark:bg-dark-card">
                <span className="inline-block px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider rounded-lg mb-4 w-fit">
                  {selectedImage.category?.name || 'Category'}
                </span>
                <h2 className="text-3xl font-semibold text-slate-800 dark:text-white mb-2">{selectedImage.name}</h2>
                <p className="text-slate-500 font-mono mb-8">Code: {selectedImage.code}</p>

                <div className="p-6 bg-slate-50 dark:bg-dark-bg rounded-2xl mb-8 border border-slate-100 dark:border-dark-border">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2 flex items-center">
                    <Sparkles size={16} className="mr-2 text-primary-500" /> Inspiration Note
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    This beautiful design is part of our curated lookbook. Experience the intricate details and premium quality that defines our collection.
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/buyer/product/${selectedImage.id}`)}
                  className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium flex items-center justify-center transition-all shadow-xs shadow-primary-600/30 hover:-translate-y-1"
                >
                  View Product Details <ArrowRight size={20} className="ml-2" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesignCatalog;
