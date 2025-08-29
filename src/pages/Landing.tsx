import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Shield, Star } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              <span className="ml-2 text-xl sm:text-2xl font-bold text-gray-900">ZimConnect</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/signin')}
                className="text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-red-600 to-pink-500 hover:shadow-lg text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-8 sm:py-12 lg:py-20 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="mb-8 lg:mb-0 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Find Your Perfect Match in the
                <span className="text-red-600"> Zimbabwean</span>
                <span className="text-pink-500"> Community</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 px-2 lg:px-0">
                Connect with like-minded Zimbabweans living in the USA. Share your culture, values, and dreams with someone who truly understands your journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-4 sm:px-0">
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-red-600 to-pink-500 hover:shadow-lg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all w-full sm:w-auto"
                >
                  Start Your Journey
                </button>
                <button
                  onClick={() => navigate('/signin')}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all w-full sm:w-auto"
                >
                  Learn More
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-12 px-4 sm:px-0">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">10K+</div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600">Active Members</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600">Success Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">50+</div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600">Cities</div>
                </div>
              </div>
            </div>
            <div className="relative w-full max-w-md lg:max-w-none mx-auto">
              <img
                src="/couple1.jpg"
                alt="Happy couple"
                className="rounded-2xl shadow-2xl w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Why Choose ZimConnect?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4 sm:px-0">
              Connecting Zimbabweans across America
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center px-4 sm:px-0">
              <div className="bg-gradient-to-br from-red-100 to-pink-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Cultural Connection</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Connect with fellow Zimbabweans who share your culture, values, and experiences.
              </p>
            </div>
            <div className="text-center px-4 sm:px-0">
              <div className="bg-gradient-to-br from-red-100 to-pink-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Safe & Secure</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Your privacy and safety are our top priorities with verified profiles and secure messaging.
              </p>
            </div>
            <div className="text-center px-4 sm:px-0 sm:col-span-2 lg:col-span-1">
              <div className="bg-gradient-to-br from-red-100 to-pink-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Meaningful Relationships</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Find love with someone who understands your heritage and shares your dreams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Success Stories
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4 sm:px-0">
              Real couples who found love on ZimConnect
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-3 sm:mb-4">
                <img
                  src="/couple2.jpg"
                  alt="Sarah & Mike"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 sm:mr-4"
                />
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900">Sarah & Mike</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                "We met on ZimConnect and instantly connected over our shared Zimbabwean heritage. Two years later, we're happily married!"
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-3 sm:mb-4">
                <img
                  src="/couple3.jpg"
                  alt="Emma & James"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 sm:mr-4"
                />
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900">Emma & James</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                "Finally, a dating app that understands our culture! Found my soulmate within 3 months!"
              </p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-3 sm:mb-4">
                <img
                  src="/couple1.jpg"
                  alt="Lisa & David"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 sm:mr-4"
                />
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900">Lisa & David</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                "ZimConnect helped us find each other across states. We're perfect for each other!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-red-600 to-pink-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-pink-100 mb-6 sm:mb-8 px-4 sm:px-0">
            Join thousands of Zimbabweans who found love on ZimConnect
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-white text-red-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all w-full sm:w-auto max-w-xs"
          >
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                <span className="ml-2 text-xl sm:text-2xl font-bold">ZimConnect</span>
              </div>
              <p className="text-gray-400 text-sm text-center md:text-left">
                Connecting Zimbabweans across America to find meaningful relationships.
              </p>
            </div>

            {/* Legal */}
            <div className="text-center md:text-left">
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left text-gray-400 text-sm mb-4 md:mb-0">
                <p>&copy; 2024 ZimConnect. All rights reserved.</p>
              </div>
              <div className="flex space-x-6 text-sm text-gray-400">
                <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}