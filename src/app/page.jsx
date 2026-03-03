import HomePage from './home/page';

// Render the home page directly at the root URL (/)
// This avoids an extra redirect that can look like a refresh
export default function RootPage() {
  return <HomePage />;
}
