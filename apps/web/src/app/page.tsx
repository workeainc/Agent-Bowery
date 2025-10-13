import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Agent Bowery
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered content management and social media automation platform
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="btn-primary btn-lg"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/auth/login"
              className="btn-outline btn-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Content Management</h3>
              <p className="card-description">
                Create, edit, and manage your content with AI-powered assistance
              </p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Social Media Automation</h3>
              <p className="card-description">
                Automate posting across multiple social media platforms
              </p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Analytics & Insights</h3>
              <p className="card-description">
                Track performance and get actionable insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
