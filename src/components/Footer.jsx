import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Bell,
  BarChart3,
  Settings,
} from 'lucide-react';

/**
 * Footer Component with About Section
 * Displays SEO-optimized information about the app, its mission, and key features
 */
function Footer({ darkMode }) {
  const { t } = useTranslation();

  const features = [
    {
      icon: TrendingUp,
      titleKey: 'footer.about.feature1.name',
      descriptionKey: 'footer.about.feature1.description',
    },
    {
      icon: Bell,
      titleKey: 'footer.about.feature2.name',
      descriptionKey: 'footer.about.feature2.description',
    },
    {
      icon: BarChart3,
      titleKey: 'footer.about.feature3.name',
      descriptionKey: 'footer.about.feature3.description',
    },
    {
      icon: Settings,
      titleKey: 'footer.about.feature4.name',
      descriptionKey: 'footer.about.feature4.description',
    },
  ];

  return (
    <footer className={`${darkMode ? 'bg-gray-900/50' : 'bg-gray-100/50'} border-t ${
      darkMode ? 'border-accent-300/10' : 'border-gray-300/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* About Section */}
        <div className="mb-16">
          <h2 className={`text-3xl font-bold tracking-tight mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {t('footer.about.title')}
          </h2>

          <p className={`text-lg mb-8 max-w-2xl leading-relaxed ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {t('footer.about.description')}
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`rounded-xl p-6 transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-800/50 border border-accent-300/20 hover:border-accent-300/40 hover:bg-gray-800/70'
                      : 'bg-white border border-gray-200 hover:border-accent-500/50 hover:shadow-md'
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                    darkMode
                      ? 'bg-accent-300/20 text-accent-300'
                      : 'bg-accent-500/20 text-accent-500'
                  }`}>
                    <Icon size={24} />
                  </div>

                  <h3 className={`text-sm font-semibold mb-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {t(feature.titleKey)}
                  </h3>

                  <p className={`text-sm leading-relaxed ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {t(feature.descriptionKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section with Copyright */}
        <div className={`border-t ${
          darkMode ? 'border-gray-800/50' : 'border-gray-200/50'
        } pt-8`}>
          <p className={`text-sm text-center ${
            darkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
