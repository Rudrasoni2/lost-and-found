import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-100 py-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 flex flex-col items-center">
        <p className="mb-4">© 2024 FindIt - AI-Powered Lost & Found Platform</p>
        <div className="flex gap-6 text-sm">
          <Link to="/about" className="hover:text-primary-600">About</Link>
          <Link to="/privacy" className="hover:text-primary-600">Privacy</Link>
          <Link to="/contact" className="hover:text-primary-600">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
